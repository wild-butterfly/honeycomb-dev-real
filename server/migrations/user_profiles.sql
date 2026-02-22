-- Migration: User Profile Fields
-- Description: Add comprehensive profile fields to users table for modern SaaS user management

-- Add profile fields to users table if they don't exist
DO $$ 
BEGIN
    -- Full name field
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'full_name') THEN
        ALTER TABLE users ADD COLUMN full_name VARCHAR(255);
    END IF;

    -- Phone number
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'phone') THEN
        ALTER TABLE users ADD COLUMN phone VARCHAR(50);
    END IF;

    -- Avatar URL
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'avatar') THEN
        ALTER TABLE users ADD COLUMN avatar TEXT;
    END IF;

    -- Job title/position
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'job_title') THEN
        ALTER TABLE users ADD COLUMN job_title VARCHAR(255);
    END IF;

    -- Department
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'department') THEN
        ALTER TABLE users ADD COLUMN department VARCHAR(255);
    END IF;

    -- Work Address
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'address') THEN
        ALTER TABLE users ADD COLUMN address TEXT;
    END IF;

    -- Timezone preference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'timezone') THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(100) DEFAULT 'UTC';
    END IF;

    -- Language preference
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'language') THEN
        ALTER TABLE users ADD COLUMN language VARCHAR(10) DEFAULT 'en';
    END IF;

    -- Profile last updated timestamp
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'profile_updated_at') THEN
        ALTER TABLE users ADD COLUMN profile_updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
    END IF;

END $$;

-- Create index for faster profile lookups
CREATE INDEX IF NOT EXISTS idx_users_full_name ON users(full_name);

-- Add comment for documentation
COMMENT ON COLUMN users.full_name IS 'User full display name';
COMMENT ON COLUMN users.phone IS 'User contact phone number';
COMMENT ON COLUMN users.avatar IS 'URL or path to user avatar image';
COMMENT ON COLUMN users.job_title IS 'User job title or position';
COMMENT ON COLUMN users.department IS 'User department or team';
COMMENT ON COLUMN users.address IS 'Work location or office address';
COMMENT ON COLUMN users.timezone IS 'User preferred timezone';
COMMENT ON COLUMN users.language IS 'User preferred language code';
COMMENT ON COLUMN users.profile_updated_at IS 'Last time profile was updated';
