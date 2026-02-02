-- Monitor Website Database Schema
-- Created by: Atlas (The Squad)

-- Drop tables if exist (for clean init)
DROP TABLE IF EXISTS incidents CASCADE;
DROP TABLE IF EXISTS check_logs CASCADE;
DROP TABLE IF EXISTS websites CASCADE;

-- ============================================
-- Table: websites
-- เก็บข้อมูลเว็บไซต์ที่ต้องการ monitor
-- ============================================
CREATE TABLE websites (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    url VARCHAR(500) NOT NULL,
    description TEXT,
    check_interval_minutes INTEGER DEFAULT 60,
    expected_status_code INTEGER DEFAULT 200,
    is_active BOOLEAN DEFAULT TRUE,
    
    -- สถานะล่าสุด
    current_status VARCHAR(20) DEFAULT 'unknown', -- 'up', 'down', 'unknown'
    last_check_at TIMESTAMP,
    last_response_time_ms INTEGER,
    last_error_message TEXT,
    
    -- uptime stats
    total_checks INTEGER DEFAULT 0,
    successful_checks INTEGER DEFAULT 0,
    uptime_percentage DECIMAL(5,2) DEFAULT 100.00,
    
    -- timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- constraints
    CONSTRAINT valid_url CHECK (url ~ '^https?://'),
    CONSTRAINT valid_status CHECK (current_status IN ('up', 'down', 'unknown'))
);

-- Index สำหรับค้นหา
CREATE INDEX idx_websites_status ON websites(current_status);
CREATE INDEX idx_websites_active ON websites(is_active);

-- ============================================
-- Table: check_logs
-- เก็บประวัติการตรวจสอบแต่ละครั้ง
-- ============================================
CREATE TABLE check_logs (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    -- ผลการตรวจสอบ
    status VARCHAR(20) NOT NULL, -- 'up', 'down'
    status_code INTEGER,
    response_time_ms INTEGER,
    error_message TEXT,
    
    -- รายละเอียดเพิ่มเติม
    checked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    checked_by VARCHAR(50) DEFAULT 'cron', -- 'cron', 'manual', 'api'
    
    -- response details (optional)
    response_headers JSONB,
    response_body_preview TEXT
);

-- Index สำหรับ query ที่ใช้บ่อย
CREATE INDEX idx_check_logs_website_id ON check_logs(website_id);
CREATE INDEX idx_check_logs_checked_at ON check_logs(checked_at DESC);
CREATE INDEX idx_check_logs_status ON check_logs(status);

-- ============================================
-- Table: incidents
-- เก็บประวัติ downtime incidents
-- ============================================
CREATE TABLE incidents (
    id SERIAL PRIMARY KEY,
    website_id INTEGER NOT NULL REFERENCES websites(id) ON DELETE CASCADE,
    
    -- incident details
    title VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(20) DEFAULT 'warning', -- 'critical', 'warning', 'info'
    
    -- timing
    started_at TIMESTAMP NOT NULL,
    resolved_at TIMESTAMP,
    duration_minutes INTEGER,
    
    -- status
    status VARCHAR(20) DEFAULT 'ongoing', -- 'ongoing', 'resolved', 'acknowledged'
    
    -- error details
    error_message TEXT,
    status_code INTEGER,
    
    -- notification
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_sent_at TIMESTAMP,
    
    -- timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_incident_status CHECK (status IN ('ongoing', 'resolved', 'acknowledged')),
    CONSTRAINT valid_severity CHECK (severity IN ('critical', 'warning', 'info'))
);

-- Index
CREATE INDEX idx_incidents_website_id ON incidents(website_id);
CREATE INDEX idx_incidents_status ON incidents(status);
CREATE INDEX idx_incidents_started_at ON incidents(started_at DESC);

-- ============================================
-- Function: Auto-update updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger สำหรับ websites
CREATE TRIGGER update_websites_updated_at 
    BEFORE UPDATE ON websites 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger สำหรับ incidents  
CREATE TRIGGER update_incidents_updated_at 
    BEFORE UPDATE ON incidents 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================
-- INSERT INTO websites (name, url, description) VALUES
--     ('Google', 'https://www.google.com', 'Search engine'),
--     ('GitHub', 'https://github.com', 'Code repository'),
--     ('Example', 'https://example.com', 'Example domain');

-- ============================================
-- Views สำหรับ Dashboard
-- ============================================

-- View: Website status overview
CREATE OR REPLACE VIEW website_status_overview AS
SELECT 
    w.id,
    w.name,
    w.url,
    w.current_status,
    w.last_check_at,
    w.last_response_time_ms,
    w.uptime_percentage,
    COUNT(DISTINCT CASE WHEN i.status = 'ongoing' THEN i.id END) AS ongoing_incidents,
    COUNT(DISTINCT CASE WHEN i.started_at > NOW() - INTERVAL '24 hours' THEN i.id END) AS incidents_24h
FROM websites w
LEFT JOIN incidents i ON w.id = i.website_id
WHERE w.is_active = TRUE
GROUP BY w.id, w.name, w.url, w.current_status, w.last_check_at, w.last_response_time_ms, w.uptime_percentage;

-- View: Daily uptime stats
CREATE OR REPLACE VIEW daily_uptime_stats AS
SELECT 
    website_id,
    DATE(checked_at) as date,
    COUNT(*) as total_checks,
    COUNT(CASE WHEN status = 'up' THEN 1 END) as up_count,
    ROUND(COUNT(CASE WHEN status = 'up' THEN 1 END) * 100.0 / COUNT(*), 2) as uptime_percentage,
    AVG(response_time_ms)::INTEGER as avg_response_time,
    MAX(response_time_ms) as max_response_time,
    MIN(response_time_ms) as min_response_time
FROM check_logs
WHERE checked_at > NOW() - INTERVAL '30 days'
GROUP BY website_id, DATE(checked_at)
ORDER BY date DESC;