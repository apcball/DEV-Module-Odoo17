import cron from 'node-cron';
import { checkAllWebsites } from '../services/monitor';
import { sendDailySummary } from '../utils/telegram';
import websiteModel from '../models/website';

let scheduledJob: cron.ScheduledTask | null = null;
let dailySummaryJob: cron.ScheduledTask | null = null;

// Start the cron job for website monitoring
export function startMonitoringJob(): void {
  // Run every hour at minute 0 (e.g., 9:00, 10:00, 11:00)
  const cronExpression = '0 * * * *';
  
  console.log(`⏰ Starting monitoring job: every hour`);
  
  scheduledJob = cron.schedule(cronExpression, async () => {
    console.log(`🕐 Running scheduled check at ${new Date().toISOString()}`);
    try {
      await checkAllWebsites('cron');
    } catch (error) {
      console.error('❌ Error in scheduled check:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Bangkok', // Thailand timezone
  });

  console.log('✅ Monitoring job started');
}

// Stop the monitoring job
export function stopMonitoringJob(): void {
  if (scheduledJob) {
    scheduledJob.stop();
    console.log('⏹️ Monitoring job stopped');
  }
}

// Start daily summary job (runs at 9:00 AM every day)
export function startDailySummaryJob(): void {
  console.log('📅 Starting daily summary job (9:00 AM daily)');
  
  dailySummaryJob = cron.schedule('0 9 * * *', async () => {
    console.log('📊 Sending daily summary...');
    try {
      const summary = await websiteModel.getWebsitesSummary();
      const total = parseInt(summary.total);
      const online = parseInt(summary.online);
      const offline = parseInt(summary.offline);
      
      // Calculate average uptime
      const websites = await websiteModel.getAllWebsites();
      const totalUptime = websites.reduce((sum, w) => sum + parseFloat(w.uptime_percentage || 0), 0);
      const avgUptime = websites.length > 0 ? totalUptime / websites.length : 100;
      
      await sendDailySummary(total, online, offline, avgUptime);
    } catch (error) {
      console.error('❌ Error sending daily summary:', error);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Bangkok',
  });

  console.log('✅ Daily summary job started');
}

// Stop daily summary job
export function stopDailySummaryJob(): void {
  if (dailySummaryJob) {
    dailySummaryJob.stop();
    console.log('⏹️ Daily summary job stopped');
  }
}

// Get job status
export function getJobStatus(): { monitoring: boolean; dailySummary: boolean } {
  return {
    monitoring: scheduledJob !== null,
    dailySummary: dailySummaryJob !== null,
  };
}

// Start all cron jobs
export function startAllJobs(): void {
  startMonitoringJob();
  startDailySummaryJob();
}

// Stop all cron jobs
export function stopAllJobs(): void {
  stopMonitoringJob();
  stopDailySummaryJob();
}

export default {
  startMonitoringJob,
  stopMonitoringJob,
  startDailySummaryJob,
  stopDailySummaryJob,
  getJobStatus,
  startAllJobs,
  stopAllJobs,
};