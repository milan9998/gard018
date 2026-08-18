-- Create members table for club membership management
CREATE TABLE IF NOT EXISTS members (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  start_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'expired', 'notified')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster queries on expiry date
CREATE INDEX IF NOT EXISTS idx_members_expiry_date ON members(expiry_date);
CREATE INDEX IF NOT EXISTS idx_members_status ON members(status);

-- Insert initial member: Stefan Stevanovic
-- Start date: 15.11.2024 (месец дана пре данашњег дана)
-- Expiry date: 15.12.2024 (за тестирање - истекао је данас)
INSERT INTO members (first_name, last_name, email, start_date, expiry_date, status)
VALUES ('Stefan', 'Stevanovic', 'stefkeee2007@gmail.com', '2024-11-15', '2024-12-15', 'active')
ON CONFLICT (email) DO NOTHING;
