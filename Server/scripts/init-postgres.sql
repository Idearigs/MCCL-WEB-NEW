-- Initialize PostgreSQL database for McCulloch Website

-- Create database if not exists (handled by docker-compose)

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create initial database structure will be handled by Sequelize migrations
-- This file is mainly for extensions and initial setup

-- Create initial admin user function (will be used later)
CREATE OR REPLACE FUNCTION create_admin_user()
RETURNS VOID AS $$
BEGIN
  -- This function will be called by the application to create admin user
  -- Implementation will be added when user model is created
END;
$$ LANGUAGE plpgsql;