import { query } from '../utils/database';
import { Incident, IncidentQueryParams, CheckLog, LogQueryParams } from '../types';

// ============================================
// Incident Models
// ============================================

// Get all incidents with optional filters
export async function getIncidents(params: IncidentQueryParams = {}): Promise<Incident[]> {
  const { websiteId, status, limit = 50, offset = 0 } = params;
  
  let sql = 'SELECT * FROM incidents WHERE 1=1';
  const values: any[] = [];
  let paramCount = 0;

  if (websiteId) {
    paramCount++;
    sql += ` AND website_id = $${paramCount}`;
    values.push(websiteId);
  }

  if (status) {
    paramCount++;
    sql += ` AND status = $${paramCount}`;
    values.push(status);
  }

  paramCount++;
  sql += ` ORDER BY started_at DESC LIMIT $${paramCount}`;
  values.push(limit);

  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  values.push(offset);

  const result = await query(sql, values);
  return result.rows;
}

// Get incident by ID
export async function getIncidentById(id: number): Promise<Incident | null> {
  const result = await query('SELECT * FROM incidents WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Get ongoing incidents for a website
export async function getOngoingIncidents(websiteId: number): Promise<Incident[]> {
  const result = await query(
    'SELECT * FROM incidents WHERE website_id = $1 AND status = \'ongoing\' ORDER BY started_at DESC',
    [websiteId]
  );
  return result.rows;
}

// Get recent incidents (last 24 hours)
export async function getRecentIncidents(limit: number = 10): Promise<Incident[]> {
  const result = await query(
    `SELECT * FROM incidents 
     ORDER BY started_at DESC LIMIT $1`,
    [limit]
  );
  return result.rows;
}

// Get incident stats
export async function getIncidentStats(): Promise<{
  ongoing: number;
  resolved24h: number;
  total24h: number;
}> {
  const result = await query(`
    SELECT 
      COUNT(CASE WHEN status = 'ongoing' THEN 1 END) as ongoing,
      COUNT(CASE WHEN status = 'resolved' AND resolved_at > NOW() - INTERVAL '24 hours' THEN 1 END) as resolved24h,
      COUNT(CASE WHEN started_at > NOW() - INTERVAL '24 hours' THEN 1 END) as total24h
    FROM incidents
  `);
  return result.rows[0];
}

// Acknowledge incident
export async function acknowledgeIncident(id: number): Promise<Incident | null> {
  const result = await query(
    "UPDATE incidents SET status = 'acknowledged', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
    [id]
  );
  return result.rows[0] || null;
}

// ============================================
// Uptime Chart Data
// ============================================

// Get uptime chart data for dashboard
export async function getUptimeChartData(
  hours: number = 24,
  websiteId?: number
): Promise<Array<{ hour: string; uptime: number; checks: number }>> {
  const websiteFilter = websiteId ? `AND website_id = ${websiteId}` : '';
  
  const result = await query(`
    WITH hourly_stats AS (
      SELECT 
        DATE_TRUNC('hour', checked_at) as hour,
        COUNT(*) as total_checks,
        COUNT(CASE WHEN status = 'up' THEN 1 END) as successful_checks
      FROM check_logs
      WHERE checked_at > NOW() - INTERVAL '${hours} hours'
      ${websiteFilter}
      GROUP BY DATE_TRUNC('hour', checked_at)
      ORDER BY hour ASC
    )
    SELECT 
      TO_CHAR(hour, 'YYYY-MM-DD HH24:00') as hour,
      CASE 
        WHEN total_checks > 0 THEN ROUND((successful_checks::DECIMAL / total_checks) * 100, 2)
        ELSE 100
      END as uptime,
      total_checks as checks
    FROM hourly_stats
  `);
  
  return result.rows;
}

// ============================================
// Check Log Models
// ============================================

// Get check logs with filters
export async function getCheckLogs(params: LogQueryParams = {}): Promise<CheckLog[]> {
  const { websiteId, status, limit = 100, offset = 0, from, to } = params;
  
  let sql = 'SELECT * FROM check_logs WHERE 1=1';
  const values: any[] = [];
  let paramCount = 0;

  if (websiteId) {
    paramCount++;
    sql += ` AND website_id = $${paramCount}`;
    values.push(websiteId);
  }

  if (status) {
    paramCount++;
    sql += ` AND status = $${paramCount}`;
    values.push(status);
  }

  if (from) {
    paramCount++;
    sql += ` AND checked_at >= $${paramCount}`;
    values.push(from);
  }

  if (to) {
    paramCount++;
    sql += ` AND checked_at <= $${paramCount}`;
    values.push(to);
  }

  paramCount++;
  sql += ` ORDER BY checked_at DESC LIMIT $${paramCount}`;
  values.push(limit);

  paramCount++;
  sql += ` OFFSET $${paramCount}`;
  values.push(offset);

  const result = await query(sql, values);
  return result.rows;
}

// Get recent logs
export async function getRecentLogs(limit: number = 50): Promise<CheckLog[]> {
  const result = await query(
    'SELECT * FROM check_logs ORDER BY checked_at DESC LIMIT $1',
    [limit]
  );
  return result.rows;
}

// Get logs for a specific website
export async function getWebsiteLogs(websiteId: number, limit: number = 100): Promise<CheckLog[]> {
  const result = await query(
    'SELECT * FROM check_logs WHERE website_id = $1 ORDER BY checked_at DESC LIMIT $2',
    [websiteId, limit]
  );
  return result.rows;
}

// Get average response time for website
export async function getAverageResponseTime(websiteId: number, hours: number = 24): Promise<number> {
  const result = await query(
    `SELECT AVG(response_time_ms)::INTEGER as avg_time 
     FROM check_logs 
     WHERE website_id = $1 AND checked_at > NOW() - INTERVAL '${hours} hours'`,
    [websiteId]
  );
  return result.rows[0]?.avg_time || 0;
}

export default {
  // Incidents
  getIncidents,
  getIncidentById,
  getOngoingIncidents,
  getRecentIncidents,
  getIncidentStats,
  acknowledgeIncident,
  getUptimeChartData,
  // Logs
  getCheckLogs,
  getRecentLogs,
  getWebsiteLogs,
  getAverageResponseTime,
};