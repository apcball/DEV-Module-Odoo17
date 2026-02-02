import axios, { AxiosResponse, AxiosError } from 'axios';
import { query, withTransaction } from '../utils/database';
import { notifyWebsiteDown, notifyWebsiteRecovered } from '../utils/telegram';
import { CheckResult, Website } from '../types';

const REQUEST_TIMEOUT = parseInt(process.env.REQUEST_TIMEOUT_SECONDS || '30') * 1000;
const MAX_RETRIES = parseInt(process.env.MAX_RETRIES || '3');
const RETRY_DELAY = parseInt(process.env.RETRY_DELAY_SECONDS || '5') * 1000;

// Check single website
export async function checkWebsite(website: Website, checkedBy: 'cron' | 'manual' | 'api' = 'cron'): Promise<CheckResult> {
  const startTime = Date.now();
  let lastError: string | undefined;
  let lastStatusCode: number | undefined;

  // Retry logic
  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response: AxiosResponse = await axios.get(website.url, {
        timeout: REQUEST_TIMEOUT,
        validateStatus: () => true, // Don't throw on error status codes
        headers: {
          'User-Agent': 'MonitorWebsite/1.0',
        },
      });

      const responseTime = Date.now() - startTime;
      const isUp = response.status === website.expected_status_code;

      // Map status to types: up | down | unknown
      let status: 'up' | 'down' | 'unknown';
      if (isUp) {
        status = 'up';
      } else if (response.status >= 500) {
        status = 'down';
      } else {
        status = 'unknown';
      }

      const result: CheckResult = {
        status,
        statusCode: response.status,
        responseTimeMs: responseTime,
        timestamp: new Date(),
      };

      // Save check result
      await saveCheckResult(website.id!, result, checkedBy);

      // Update website status
      await updateWebsiteStatus(website.id!, result);

      // Handle status change
      await handleStatusChange(website, result);

      return result;

    } catch (error) {
      lastError = (error as AxiosError).message;
      lastStatusCode = (error as AxiosError).response?.status;

      if (attempt < MAX_RETRIES) {
        console.log(`⚠️ Retry ${attempt}/${MAX_RETRIES} for ${website.url} after ${RETRY_DELAY}ms`);
        await sleep(RETRY_DELAY);
      }
    }
  }

  // All retries failed - website is down
  const responseTime = Date.now() - startTime;
  const result: CheckResult = {
    status: 'down',
    statusCode: lastStatusCode,
    responseTimeMs: responseTime,
    errorMessage: lastError,
    timestamp: new Date(),
  };

  // Save failed check result
  await saveCheckResult(website.id!, result, checkedBy);
  await updateWebsiteStatus(website.id!, result);
  await handleStatusChange(website, result);

  return result;
}

// Save check result to database
async function saveCheckResult(
  websiteId: number,
  result: CheckResult,
  checkedBy: 'cron' | 'manual' | 'api'
): Promise<void> {
  await query(
    `INSERT INTO check_logs (
      website_id, status, status_code, response_time_ms, 
      error_message, checked_at, checked_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
    [
      websiteId,
      result.status,
      result.statusCode || null,
      result.responseTimeMs,
      result.errorMessage || null,
      result.timestamp,
      checkedBy,
    ]
  );
}

// Update website status in database
async function updateWebsiteStatus(websiteId: number, result: CheckResult): Promise<void> {
  await query(
    `UPDATE websites 
     SET current_status = $1,
         last_check_at = $2,
         last_response_time_ms = $3,
         last_error_message = $4,
         total_checks = total_checks + 1,
         successful_checks = CASE WHEN $1 = 'up' THEN successful_checks + 1 ELSE successful_checks END,
         uptime_percentage = CASE 
           WHEN total_checks + 1 > 0 THEN 
             (successful_checks + CASE WHEN $1 = 'up' THEN 1 ELSE 0 END)::DECIMAL / (total_checks + 1) * 100
           ELSE 100
         END
     WHERE id = $5`,
    [result.status, result.timestamp, result.responseTimeMs, result.errorMessage || null, websiteId]
  );
}

// Handle status change (create/resolve incidents, send notifications)
async function handleStatusChange(website: Website, result: CheckResult): Promise<void> {
  const prevStatus = website.current_status;
  const newStatus = result.status;

  // Status changed from up/unknown to down (website down)
  if ((prevStatus === 'up' || prevStatus === 'unknown') && newStatus === 'down') {
    console.log(`🔴 ${website.name} went down!`);
    
    // Create new incident
    await query(
      `INSERT INTO incidents (website_id, title, description, started_at, error_message, status_code, severity)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [
        website.id,
        `Website Down: ${website.name}`,
        `Website ${website.url} is not responding`,
        result.timestamp,
        result.errorMessage || `HTTP ${result.statusCode}`,
        result.statusCode || null,
        'critical',
      ]
    );

    // Send notification with website-specific chat_id
    await notifyWebsiteDown(
      website.name,
      website.url,
      result.errorMessage || `HTTP ${result.statusCode}`,
      result.statusCode,
      website.telegram_chat_id
    );
  }

  // Status changed from down to up (recovered)
  if (prevStatus === 'down' && newStatus === 'up') {
    console.log(`🟢 ${website.name} is back up!`);
    
    // Resolve ongoing incident
    const incidentResult = await query(
      `SELECT id, started_at FROM incidents 
       WHERE website_id = $1 AND status = 'ongoing' 
       ORDER BY started_at DESC LIMIT 1`,
      [website.id]
    );

    if (incidentResult.rows.length > 0) {
      const incident = incidentResult.rows[0];
      const durationMs = result.timestamp.getTime() - new Date(incident.started_at).getTime();
      const durationMinutes = Math.floor(durationMs / 60000);
      const durationStr = durationMinutes < 1 
        ? `${Math.floor(durationMs / 1000)} seconds` 
        : `${durationMinutes} minutes`;

      await query(
        `UPDATE incidents 
         SET status = 'resolved', 
             resolved_at = $1, 
             duration_minutes = $2,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [result.timestamp, durationMinutes || 1, incident.id]
      );

      // Send recovery notification with website-specific chat_id
      await notifyWebsiteRecovered(
        website.name,
        website.url,
        durationStr,
        website.telegram_chat_id
      );
    }
  }
}

// Check all active websites
export async function checkAllWebsites(checkedBy: 'cron' | 'manual' | 'api' = 'cron'): Promise<void> {
  console.log(`🔄 Starting check for all websites at ${new Date().toISOString()}`);
  
  const result = await query('SELECT * FROM websites WHERE is_active = TRUE');
  const websites = result.rows;

  console.log(`📋 Found ${websites.length} active websites to check`);

  for (const website of websites) {
    try {
      await checkWebsite(website, checkedBy);
      // Small delay between checks to avoid overwhelming
      await sleep(1000);
    } catch (error) {
      console.error(`❌ Error checking ${website.name}:`, error);
    }
  }

  console.log(`✅ Completed checking all websites at ${new Date().toISOString()}`);
}

// Helper function
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export default {
  checkWebsite,
  checkAllWebsites,
};