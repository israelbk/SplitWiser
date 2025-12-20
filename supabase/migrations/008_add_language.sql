-- Add language preference column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'en';

-- Add check constraint for valid language codes
ALTER TABLE users ADD CONSTRAINT valid_language CHECK (language IN ('en', 'he', 'es'));

