-- Complete Supabase Database Schema
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS email_notifications CASCADE;
DROP TABLE IF EXISTS system_settings CASCADE;
DROP TABLE IF EXISTS ticket_activities CASCADE;
DROP TABLE IF EXISTS ticket_watchers CASCADE;
DROP TABLE IF EXISTS attachments CASCADE;
DROP TABLE IF EXISTS ticket_comments CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS departments CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;

-- Drop existing types if they exist
DROP TYPE IF EXISTS setting_type CASCADE;
DROP TYPE IF EXISTS notification_status CASCADE;
DROP TYPE IF EXISTS ticket_status CASCADE;
DROP TYPE IF EXISTS ticket_priority CASCADE;
DROP TYPE IF EXISTS user_status CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'supervisor', 'user');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'inactive', 'suspended');
CREATE TYPE ticket_priority AS ENUM ('low', 'medium', 'high', 'urgent');
CREATE TYPE ticket_status AS ENUM ('open', 'in_progress', 'pending', 'resolved', 'closed');
CREATE TYPE notification_status AS ENUM ('pending', 'sent', 'failed');
CREATE TYPE setting_type AS ENUM ('string', 'number', 'boolean', 'json');

-- Organizations table
CREATE TABLE organizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    address TEXT,
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#6366f1',
    secondary_color VARCHAR(7) DEFAULT '#8b5cf6',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    supervisor_id INTEGER, -- Will be linked after users table is created
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table (integer PK with UUID bridge to Supabase Auth)
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(50),
    avatar_url VARCHAR(500),
    role user_role DEFAULT 'user',
    status user_status DEFAULT 'pending',
    last_login TIMESTAMP WITH TIME ZONE,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    auth_user_id UUID UNIQUE -- Bridge to Supabase Auth users
);

-- Add foreign key constraint for department supervisor
ALTER TABLE departments 
ADD CONSTRAINT fk_department_supervisor 
FOREIGN KEY (supervisor_id) REFERENCES users(id) ON DELETE SET NULL;

-- Ticket categories table
CREATE TABLE ticket_categories (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    color VARCHAR(7) DEFAULT '#6366f1',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tickets table
CREATE TABLE tickets (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    ticket_number VARCHAR(50) UNIQUE NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT NOT NULL,
    category_id INTEGER REFERENCES ticket_categories(id) ON DELETE SET NULL,
    department_id INTEGER REFERENCES departments(id) ON DELETE SET NULL,
    priority ticket_priority DEFAULT 'medium',
    status ticket_status DEFAULT 'open',
    created_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    resolved_at TIMESTAMP WITH TIME ZONE,
    closed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket comments/chat table
CREATE TABLE ticket_comments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_internal BOOLEAN DEFAULT false,
    is_system_message BOOLEAN DEFAULT false,
    parent_comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- File attachments table
CREATE TABLE attachments (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    comment_id INTEGER REFERENCES ticket_comments(id) ON DELETE CASCADE,
    uploaded_by INTEGER REFERENCES users(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ticket watchers table (for notifications)
CREATE TABLE ticket_watchers (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ticket_id, user_id)
);

-- Ticket activity log table
CREATE TABLE ticket_activities (
    id SERIAL PRIMARY KEY,
    ticket_id INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    old_value TEXT,
    new_value TEXT,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email notifications queue table
CREATE TABLE email_notifications (
    id SERIAL PRIMARY KEY,
    to_email VARCHAR(255) NOT NULL,
    subject VARCHAR(500) NOT NULL,
    body TEXT NOT NULL,
    template_name VARCHAR(100),
    template_data JSONB,
    status notification_status DEFAULT 'pending',
    attempts INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 3,
    error_message TEXT,
    scheduled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System settings table
CREATE TABLE system_settings (
    id SERIAL PRIMARY KEY,
    organization_id INTEGER REFERENCES organizations(id) ON DELETE CASCADE,
    setting_key VARCHAR(100) NOT NULL,
    setting_value TEXT,
    setting_type setting_type DEFAULT 'string',
    description TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(organization_id, setting_key)
);

-- Create indexes for better performance
CREATE INDEX idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_organization ON users(organization_id);
CREATE INDEX idx_users_department ON users(department_id);

CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_priority ON tickets(priority);
CREATE INDEX idx_tickets_created_by ON tickets(created_by);
CREATE INDEX idx_tickets_assigned_to ON tickets(assigned_to);
CREATE INDEX idx_tickets_department ON tickets(department_id);
CREATE INDEX idx_tickets_organization ON tickets(organization_id);
CREATE INDEX idx_tickets_created_at ON tickets(created_at);
CREATE INDEX idx_tickets_ticket_number ON tickets(ticket_number);

CREATE INDEX idx_ticket_comments_ticket_id ON ticket_comments(ticket_id);
CREATE INDEX idx_ticket_comments_user_id ON ticket_comments(user_id);
CREATE INDEX idx_ticket_comments_created_at ON ticket_comments(created_at);

CREATE INDEX idx_ticket_activities_ticket_id ON ticket_activities(ticket_id);
CREATE INDEX idx_ticket_activities_user_id ON ticket_activities(user_id);
CREATE INDEX idx_ticket_activities_created_at ON ticket_activities(created_at);

CREATE INDEX idx_email_notifications_status ON email_notifications(status);
CREATE INDEX idx_email_notifications_scheduled_at ON email_notifications(scheduled_at);

-- Create functions for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_organizations_updated_at 
    BEFORE UPDATE ON organizations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_departments_updated_at 
    BEFORE UPDATE ON departments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at 
    BEFORE UPDATE ON tickets 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_comments_updated_at 
    BEFORE UPDATE ON ticket_comments 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ticket_categories_updated_at 
    BEFORE UPDATE ON ticket_categories 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default organization
INSERT INTO organizations (name, email, phone, address) VALUES 
('Default Organization', 'admin@organization.com', '+1-555-0123', '123 Business St, City, State 12345');

-- Insert default departments
INSERT INTO departments (organization_id, name, description) VALUES 
(1, 'IT Support', 'Information Technology support and maintenance'),
(1, 'Customer Service', 'Customer support and service'),
(1, 'Development', 'Software development and engineering'),
(1, 'Quality Assurance', 'Testing and quality assurance'),
(1, 'General', 'General inquiries and support');

-- Insert ticket categories
INSERT INTO ticket_categories (organization_id, name, description, color) VALUES 
(1, 'Technical Support', 'Technical issues and support requests', '#3b82f6'),
(1, 'Bug Report', 'Software bugs and issues', '#ef4444'),
(1, 'Feature Request', 'New feature requests and enhancements', '#10b981'),
(1, 'General Inquiry', 'General questions and inquiries', '#6366f1'),
(1, 'Account Issues', 'Account related problems', '#f59e0b'),
(1, 'Hardware Issues', 'Hardware problems and requests', '#8b5cf6'),
(1, 'Network Issues', 'Network connectivity problems', '#f97316'),
(1, 'Security Issues', 'Security concerns and incidents', '#dc2626');

-- Insert default system settings
INSERT INTO system_settings (organization_id, setting_key, setting_value, setting_type, description, is_public) VALUES 
(1, 'ticket_auto_assignment', 'false', 'boolean', 'Automatically assign tickets to available users', false),
(1, 'email_notifications', 'true', 'boolean', 'Enable email notifications', false),
(1, 'max_file_size', '10485760', 'number', 'Maximum file upload size in bytes (10MB)', false),
(1, 'allowed_file_types', '["jpg","jpeg","png","gif","pdf","doc","docx","txt","zip"]', 'json', 'Allowed file types for uploads', false),
(1, 'ticket_number_prefix', 'TKT', 'string', 'Prefix for ticket numbers', false),
(1, 'business_hours_start', '09:00', 'string', 'Business hours start time', true),
(1, 'business_hours_end', '17:00', 'string', 'Business hours end time', true),
(1, 'support_email', 'support@organization.com', 'string', 'Support email address', true),
(1, 'support_phone', '+1-555-0123', 'string', 'Support phone number', true),
(1, 'auto_close_resolved_tickets', '7', 'number', 'Days after which resolved tickets are auto-closed', false),
(1, 'require_category', 'false', 'boolean', 'Require category selection when creating tickets', false);

-- Create a function to automatically set ticket status timestamps
CREATE OR REPLACE FUNCTION update_ticket_status_timestamps()
RETURNS TRIGGER AS $$
BEGIN
    -- Set resolved_at when status changes to resolved
    IF NEW.status = 'resolved' AND OLD.status != 'resolved' THEN
        NEW.resolved_at = NOW();
    END IF;
    
    -- Set closed_at when status changes to closed
    IF NEW.status = 'closed' AND OLD.status != 'closed' THEN
        NEW.closed_at = NOW();
    END IF;
    
    -- Clear timestamps if status changes away from resolved/closed
    IF NEW.status != 'resolved' AND OLD.status = 'resolved' THEN
        NEW.resolved_at = NULL;
    END IF;
    
    IF NEW.status != 'closed' AND OLD.status = 'closed' THEN
        NEW.closed_at = NULL;
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for ticket status timestamps
CREATE TRIGGER update_ticket_status_timestamps_trigger
    BEFORE UPDATE ON tickets
    FOR EACH ROW EXECUTE FUNCTION update_ticket_status_timestamps();

-- Enable Row Level Security (RLS) on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_watchers ENABLE ROW LEVEL SECURITY;
ALTER TABLE ticket_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (basic policies - you may need to adjust based on your needs)
-- Allow service role to bypass RLS
CREATE POLICY "Service role can do everything" ON organizations FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON departments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON ticket_categories FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON tickets FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON ticket_comments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON attachments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON ticket_watchers FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON ticket_activities FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON email_notifications FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role can do everything" ON system_settings FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read their own profile" ON users FOR SELECT USING (auth.uid() = auth_user_id);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (auth.uid() = auth_user_id);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;
