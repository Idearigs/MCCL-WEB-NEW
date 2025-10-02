-- Create super admin user directly in database
INSERT INTO admins (
  id,
  email,
  password,
  first_name,
  last_name,
  role,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'admin@mcculloch.com',
  '$2a$12$EQZg.qbE8L5vYKmF8PzI/.KJ8jNXsBNgKb6pZg1b7qVnNnl8o4GZS', -- bcrypt hash of 'admin123!'
  'Super',
  'Admin',
  'super_admin',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (email) DO UPDATE SET
  password = '$2a$12$EQZg.qbE8L5vYKmF8PzI/.KJ8jNXsBNgKb6pZg1b7qVnNnl8o4GZS',
  role = 'super_admin',
  is_active = true,
  updated_at = NOW();