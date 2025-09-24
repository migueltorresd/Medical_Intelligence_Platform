-- Medical Intelligence Platform - Database Initialization
-- ======================================================

-- Create database if it doesn't exist (this runs automatically)
-- The database is created by the POSTGRES_DB environment variable

-- Create extensions for advanced PostgreSQL features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create schemas for better organization
CREATE SCHEMA IF NOT EXISTS medical_data;
CREATE SCHEMA IF NOT EXISTS audit_logs;
CREATE SCHEMA IF NOT EXISTS compliance;

-- Set timezone for medical compliance
SET timezone = 'UTC';

-- Create custom types for medical data
DO $$
BEGIN
    -- Medical Role enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'medical_role_enum') THEN
        CREATE TYPE medical_role_enum AS ENUM (
            'patient',
            'doctor', 
            'nurse',
            'specialist',
            'oncologist',
            'institution_admin',
            'caregiver',
            'researcher',
            'admin',
            'user'
        );
    END IF;

    -- Patient Status enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'patient_status_enum') THEN
        CREATE TYPE patient_status_enum AS ENUM (
            'active',
            'inactive',
            'discharged',
            'deceased',
            'transferred'
        );
    END IF;

    -- Gender enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_enum') THEN
        CREATE TYPE gender_enum AS ENUM (
            'male',
            'female',
            'other',
            'prefer_not_to_say'
        );
    END IF;

    -- Blood Type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blood_type_enum') THEN
        CREATE TYPE blood_type_enum AS ENUM (
            'A+', 'A-',
            'B+', 'B-',
            'AB+', 'AB-',
            'O+', 'O-',
            'unknown'
        );
    END IF;

    -- Insurance Type enum
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'insurance_type_enum') THEN
        CREATE TYPE insurance_type_enum AS ENUM (
            'public',
            'private',
            'mixed',
            'none'
        );
    END IF;
END
$$;

-- Create indexes for performance optimization
-- These will be created automatically by TypeORM, but we can pre-create some critical ones

-- Create medical compliance user for application
-- (This user will be created by the environment variables in docker-compose.yml)

-- Set up row-level security for multi-tenancy
ALTER DEFAULT PRIVILEGES IN SCHEMA medical_data GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO medical_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA audit_logs GRANT SELECT, INSERT ON TABLES TO medical_admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA compliance GRANT SELECT, INSERT, UPDATE ON TABLES TO medical_admin;

-- Create function for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create function for generating medical record numbers
CREATE OR REPLACE FUNCTION generate_mrn(institution_prefix TEXT DEFAULT 'MIP')
RETURNS TEXT AS $$
DECLARE
    year_part TEXT;
    sequence_num BIGINT;
    mrn TEXT;
BEGIN
    year_part := EXTRACT(year FROM CURRENT_DATE)::TEXT;
    
    -- Get next sequence number (you could use a sequence here)
    SELECT COALESCE(MAX(CAST(SPLIT_PART(SPLIT_PART(medical_record_number, '-', 3), '', 1) AS INTEGER)), 0) + 1
    INTO sequence_num
    FROM patients 
    WHERE medical_record_number LIKE institution_prefix || '-' || year_part || '-%';
    
    mrn := institution_prefix || '-' || year_part || '-' || LPAD(sequence_num::TEXT, 6, '0');
    
    RETURN mrn;
END;
$$ LANGUAGE plpgsql;

-- Create audit trigger function for compliance
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_logs.table_audit_log (
            table_name,
            operation,
            row_id,
            new_values,
            changed_by,
            changed_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id,
            row_to_json(NEW),
            current_user,
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_logs.table_audit_log (
            table_name,
            operation,
            row_id,
            old_values,
            new_values,
            changed_by,
            changed_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            NEW.id,
            row_to_json(OLD),
            row_to_json(NEW),
            current_user,
            CURRENT_TIMESTAMP
        );
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_logs.table_audit_log (
            table_name,
            operation,
            row_id,
            old_values,
            changed_by,
            changed_at
        ) VALUES (
            TG_TABLE_NAME,
            TG_OP,
            OLD.id,
            row_to_json(OLD),
            current_user,
            CURRENT_TIMESTAMP
        );
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs.table_audit_log (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    row_id UUID,
    old_values JSONB,
    new_values JSONB,
    changed_by TEXT NOT NULL,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT valid_operation CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE'))
);

-- Create indexes for audit log performance
CREATE INDEX IF NOT EXISTS idx_audit_table_name ON audit_logs.table_audit_log(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_changed_at ON audit_logs.table_audit_log(changed_at);
CREATE INDEX IF NOT EXISTS idx_audit_row_id ON audit_logs.table_audit_log(row_id);

-- Grant permissions
GRANT USAGE ON SCHEMA medical_data TO medical_admin;
GRANT USAGE ON SCHEMA audit_logs TO medical_admin;
GRANT USAGE ON SCHEMA compliance TO medical_admin;

-- Log successful initialization
INSERT INTO audit_logs.table_audit_log (
    table_name,
    operation,
    new_values,
    changed_by,
    changed_at
) VALUES (
    'database_init',
    'INSERT',
    '{"message": "Medical Intelligence Platform database initialized successfully", "version": "1.0.0"}',
    'system',
    CURRENT_TIMESTAMP
);

-- Display completion message
DO $$
BEGIN
    RAISE NOTICE 'Medical Intelligence Platform database initialized successfully!';
    RAISE NOTICE 'Database: medical_intelligence_platform';
    RAISE NOTICE 'User: medical_admin';
    RAISE NOTICE 'Schemas created: medical_data, audit_logs, compliance';
    RAISE NOTICE 'Extensions enabled: uuid-ossp, pgcrypto';
    RAISE NOTICE 'Custom types created for medical data';
    RAISE NOTICE 'Audit logging system enabled';
END
$$;