-- =====================================================
-- IT Ticket Request Database Schema
-- ออกแบบโดย: Atlas (Backend/API)
-- =====================================================

-- 1. ตาราง Users (ผู้ใช้งาน)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    department VARCHAR(50),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'it_staff', 'admin', 'manager')),
    phone VARCHAR(20),
    avatar_url VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. ตาราง Categories (หมวดหมู่ปัญหา)
CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    color VARCHAR(7) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. ตาราง Tickets (คำขอ IT Support)
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    ticket_number VARCHAR(20) UNIQUE NOT NULL, -- รหัส Ticket เช่น IT-20250201-001
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    
    -- ความสัมพันธ์
    requester_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    -- สถานะ
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    
    -- SLA
    sla_due TIMESTAMP, -- เวลาที่ต้องแก้ไขตาม SLA
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    
    -- สถานที่/ทรัพย์สิน
    location VARCHAR(100),
    asset_tag VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. ตาราง Ticket Comments (ความคิดเห็น/อัพเดท)
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT FALSE, -- เป็นคอมเมนต์ภายใน (เฉพาะ IT Staff)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. ตาราง Ticket Attachments (ไฟล์แนบ)
CREATE TABLE ticket_attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL, -- bytes
    mime_type VARCHAR(100),
    uploaded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. ตาราง Ticket History (ประวัติการเปลี่ยนแปลง)
CREATE TABLE ticket_history (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    field_name VARCHAR(50) NOT NULL, -- เช่น status, priority, assigned_to
    old_value TEXT,
    new_value TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. ตาราง SLAs (กำหนด SLA ตาม Priority)
CREATE TABLE sla_policies (
    id SERIAL PRIMARY KEY,
    priority VARCHAR(10) NOT NULL UNIQUE CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    response_time_hours INTEGER NOT NULL, -- เวลาตอบกลับ (ชั่วโมง)
    resolution_time_hours INTEGER NOT NULL, -- เวลาแก้ไข (ชั่วโมง)
    is_active BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- Indexes (เพิ่มประสิทธิภาพการค้นหา)
-- =====================================================
CREATE INDEX idx_tickets_requester ON tickets(requester_id);
CREATE INDEX idx_tickets_assigned ON tickets(assigned_to);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created ON tickets(created_at);
CREATE INDEX idx_tickets_category ON tickets(category_id);
CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);
CREATE INDEX idx_history_ticket ON ticket_history(ticket_id);

-- =====================================================
-- Insert Default Data
-- =====================================================

-- หมวดหมู่เริ่มต้น
INSERT INTO categories (name, description, icon, color) VALUES
('Hardware', 'ปัญหาอุปกรณ์คอมพิวเตอร์ เช่น คีย์บอร์ด เมาส์ จอมอนิเตอร์', 'Monitor', '#EF4444'),
('Software', 'ปัญหาโปรแกรม แอพพลิเคชัน หรือระบบปฏิบัติการ', 'Code', '#3B82F6'),
('Network', 'ปัญหาเครือข่าย อินเทอร์เน็ต Wi-Fi', 'Wifi', '#10B981'),
('Printer', 'ปัญหาเครื่องพิมพ์ สแกนเนอร์', 'Printer', '#F59E0B'),
('Email', 'ปัญหาอีเมล บัญชีผู้ใช้งาน', 'Mail', '#8B5CF6'),
('Access/Security', 'ขอสิทธิ์การใช้งาน รีเซ็ตรหัสผ่าน', 'Lock', '#EC4899'),
('Other', 'ปัญหาอื่นๆ ที่ไม่เข้าหมวดหมู่', 'HelpCircle', '#6B7280');

-- SLA Policies เริ่มต้น
INSERT INTO sla_policies (priority, response_time_hours, resolution_time_hours) VALUES
('low', 24, 72),
('medium', 8, 48),
('high', 4, 24),
('critical', 1, 4);

-- ผู้ใช้ Admin เริ่มต้น (รหัสผ่านต้อง hash ก่อนใช้งานจริง)
INSERT INTO users (username, email, password_hash, full_name, department, role) VALUES
('admin', 'admin@company.com', '$2b$10$...', 'System Administrator', 'IT', 'admin'),
('itsupport', 'itsupport@company.com', '$2b$10$...', 'IT Support Team', 'IT', 'it_staff');
