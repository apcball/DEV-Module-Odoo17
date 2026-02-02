import { query } from '../utils/database';
import { Website, CreateWebsiteDTO, UpdateWebsiteDTO } from '../types';

const MAX_WEBSITES = 10;

// Get all websites
export async function getAllWebsites(): Promise<Website[]> {
  const result = await query('SELECT * FROM websites ORDER BY created_at DESC');
  return result.rows;
}

// Get website by ID
export async function getWebsiteById(id: number): Promise<Website | null> {
  const result = await query('SELECT * FROM websites WHERE id = $1', [id]);
  return result.rows[0] || null;
}

// Get total count of websites
export async function getWebsitesCount(): Promise<number> {
  const result = await query('SELECT COUNT(*) as count FROM websites');
  return parseInt(result.rows[0].count);
}

// Create new website
export async function createWebsite(data: CreateWebsiteDTO): Promise<Website> {
  // Check if maximum limit reached
  const count = await getWebsitesCount();
  if (count >= MAX_WEBSITES) {
    throw new Error('Maximum 10 websites allowed');
  }

  const result = await query(
    `INSERT INTO websites (
      name, url, description, check_interval_minutes, expected_status_code, telegram_chat_id
    ) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
    [
      data.name,
      data.url,
      data.description || null,
      data.check_interval_minutes || 60,
      data.expected_status_code || 200,
      data.telegram_chat_id || null,
    ]
  );
  return result.rows[0];
}

// Update website
export async function updateWebsite(id: number, data: UpdateWebsiteDTO): Promise<Website | null> {
  const existing = await getWebsiteById(id);
  if (!existing) return null;

  const result = await query(
    `UPDATE websites 
     SET name = COALESCE($1, name),
         url = COALESCE($2, url),
         description = COALESCE($3, description),
         check_interval_minutes = COALESCE($4, check_interval_minutes),
         expected_status_code = COALESCE($5, expected_status_code),
         is_active = COALESCE($6, is_active),
         telegram_chat_id = COALESCE($7, telegram_chat_id),
         updated_at = CURRENT_TIMESTAMP
     WHERE id = $8 RETURNING *`,
    [
      data.name,
      data.url,
      data.description,
      data.check_interval_minutes,
      data.expected_status_code,
      data.is_active,
      data.telegram_chat_id,
      id,
    ]
  );
  return result.rows[0];
}

// Delete website
export async function deleteWebsite(id: number): Promise<boolean> {
  const result = await query('DELETE FROM websites WHERE id = $1 RETURNING id', [id]);
  return result.rowCount > 0;
}

// Get active websites for monitoring
export async function getActiveWebsites(): Promise<Website[]> {
  const result = await query('SELECT * FROM websites WHERE is_active = TRUE');
  return result.rows;
}

// Get websites summary for dashboard
export async function getWebsitesSummary(): Promise<{
  total: number;
  up: number;
  down: number;
  unknown: number;
}> {
  const result = await query(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN current_status = 'up' THEN 1 END) as up,
      COUNT(CASE WHEN current_status = 'down' THEN 1 END) as down,
      COUNT(CASE WHEN current_status = 'unknown' THEN 1 END) as unknown
    FROM websites
    WHERE is_active = TRUE
  `);
  return result.rows[0];
}

export default {
  getAllWebsites,
  getWebsiteById,
  getWebsitesCount,
  createWebsite,
  updateWebsite,
  deleteWebsite,
  getActiveWebsites,
  getWebsitesSummary,
};