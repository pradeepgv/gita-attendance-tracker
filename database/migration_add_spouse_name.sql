-- Migration: Add spouse_name to families table
-- Run this in the Supabase SQL Editor

ALTER TABLE families
ADD COLUMN spouse_name TEXT;
