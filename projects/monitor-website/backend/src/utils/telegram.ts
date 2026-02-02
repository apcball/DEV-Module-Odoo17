import TelegramBot from 'node-telegram-bot-api';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.TELEGRAM_BOT_TOKEN;
const defaultChatId = process.env.TELEGRAM_CHAT_ID;
const enabled = process.env.ENABLE_TELEGRAM_NOTIFICATIONS === 'true';

let bot: TelegramBot | null = null;

if (enabled && token && token !== 'your_telegram_bot_token_here') {
  try {
    bot = new TelegramBot(token, { polling: false });
    console.log('📱 Telegram bot initialized');
  } catch (error) {
    console.error('❌ Failed to initialize Telegram bot:', error);
  }
} else {
  console.log('ℹ️ Telegram notifications disabled or not configured');
}

// Send notification message to specific chat ID
export async function sendTelegramNotification(
  message: string,
  chatId?: string
): Promise<boolean> {
  const targetChatId = chatId || defaultChatId;
  
  if (!enabled || !bot || !targetChatId) {
    console.log('📭 Telegram notification skipped (disabled or not configured)');
    return false;
  }

  try {
    await bot.sendMessage(targetChatId, message, { parse_mode: 'HTML' });
    console.log('✅ Telegram notification sent');
    return true;
  } catch (error) {
    console.error('❌ Failed to send Telegram notification:', error);
    return false;
  }
}

// Website down notification
export async function notifyWebsiteDown(
  websiteName: string,
  websiteUrl: string,
  errorMessage: string,
  statusCode?: number,
  chatId?: string
): Promise<boolean> {
  const statusInfo = statusCode ? ` (Status: ${statusCode})` : '';
  const message = `
🚨 <b>ALERT: Website Down!</b>

<b>Website:</b> ${websiteName}
<b>URL:</b> ${websiteUrl}
<b>Error:</b> ${errorMessage}${statusInfo}
<b>Time:</b> ${new Date().toLocaleString('th-TH')}

Please check immediately!
  `.trim();

  return sendTelegramNotification(message, chatId);
}

// Website recovered notification
export async function notifyWebsiteRecovered(
  websiteName: string,
  websiteUrl: string,
  duration: string,
  chatId?: string
): Promise<boolean> {
  const message = `
✅ <b>Website Recovered</b>

<b>Website:</b> ${websiteName}
<b>URL:</b> ${websiteUrl}
<b>Downtime:</b> ${duration}
<b>Time:</b> ${new Date().toLocaleString('th-TH')}

Service is back online! 🎉
  `.trim();

  return sendTelegramNotification(message, chatId);
}

// Daily summary notification
export async function sendDailySummary(
  totalSites: number,
  upCount: number,
  downCount: number,
  avgUptime: number,
  chatId?: string
): Promise<boolean> {
  const statusEmoji = downCount > 0 ? '⚠️' : '✅';
  const message = `
${statusEmoji} <b>Daily Monitoring Summary</b>

<b>Total Sites:</b> ${totalSites}
<b>🟢 Online:</b> ${upCount}
<b>🔴 Offline:</b> ${downCount}
<b>📊 Avg Uptime:</b> ${avgUptime.toFixed(2)}%

<b>Time:</b> ${new Date().toLocaleString('th-TH')}
  `.trim();

  return sendTelegramNotification(message, chatId);
}

// Test notification
export async function sendTestNotification(chatId?: string): Promise<boolean> {
  const message = `
🧪 <b>Test Notification</b>

This is a test message from Monitor Website system.
If you see this, your Telegram notifications are working correctly! ✅

<b>Time:</b> ${new Date().toLocaleString('th-TH')}
  `.trim();

  return sendTelegramNotification(message, chatId);
}

export default {
  sendTelegramNotification,
  notifyWebsiteDown,
  notifyWebsiteRecovered,
  sendDailySummary,
  sendTestNotification,
};