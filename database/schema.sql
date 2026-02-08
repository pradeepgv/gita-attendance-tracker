-- Bhagavad Gita Attendance Tracker - Database Schema
-- Run this in the Supabase SQL Editor

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Families table
CREATE TABLE families (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  email TEXT,
  mobile TEXT,
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Australia/Sydney')
);

-- Attendance table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  adults_count INTEGER NOT NULL DEFAULT 0 CHECK (adults_count >= 0),
  children_count INTEGER NOT NULL DEFAULT 0 CHECK (children_count >= 0),
  created_at TIMESTAMPTZ DEFAULT (NOW() AT TIME ZONE 'Australia/Sydney'),
  UNIQUE(family_id, date)
);

-- Indexes for faster queries
CREATE INDEX idx_attendance_date ON attendance(date);
CREATE INDEX idx_attendance_family_id ON attendance(family_id);
CREATE INDEX idx_families_name ON families(name);

-- Row Level Security (RLS)
-- Enable RLS on both tables
ALTER TABLE families ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;

-- Allow all operations via the anon key (public access for this app)
CREATE POLICY "Allow all operations on families" ON families
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on attendance" ON attendance
  FOR ALL USING (true) WITH CHECK (true);
