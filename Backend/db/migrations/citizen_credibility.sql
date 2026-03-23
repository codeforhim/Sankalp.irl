-- Migration: Citizen Credibility Score System
-- Run this after init.sql

-- 1. Add 'rejected' to the complaints status check (if not already done)
ALTER TABLE complaints DROP CONSTRAINT IF EXISTS complaints_status_check;
ALTER TABLE complaints ADD CONSTRAINT complaints_status_check
  CHECK (status IN ('reported', 'assigned', 'in_progress', 'resolved', 'verified', 'flagged_for_review', 'rejected'));

-- 2. Add credibility_score to users (separate from trust_score)
ALTER TABLE users ADD COLUMN IF NOT EXISTS credibility_score INTEGER DEFAULT 50;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credibility_votes_total INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS credibility_votes_correct INTEGER DEFAULT 0;

-- 3. Complaint Polls Table
-- Created when a ward officer uploads an "after" image
CREATE TABLE IF NOT EXISTS complaint_polls (
    id SERIAL PRIMARY KEY,
    complaint_id INTEGER REFERENCES complaints(id) ON DELETE CASCADE UNIQUE,
    before_image_url VARCHAR(512),
    after_image_url VARCHAR(512),
    is_active BOOLEAN DEFAULT TRUE,
    admin_verdict VARCHAR(20) CHECK (admin_verdict IN ('approved', 'rejected', NULL)),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE
);

-- 4. Poll Votes Table
-- One vote per citizen per poll
CREATE TABLE IF NOT EXISTS poll_votes (
    id SERIAL PRIMARY KEY,
    poll_id INTEGER REFERENCES complaint_polls(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    vote VARCHAR(10) NOT NULL CHECK (vote IN ('done', 'not_done')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(poll_id, user_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_complaint_polls_complaint_id ON complaint_polls(complaint_id);
CREATE INDEX IF NOT EXISTS idx_complaint_polls_is_active ON complaint_polls(is_active);
CREATE INDEX IF NOT EXISTS idx_poll_votes_poll_id ON poll_votes(poll_id);
CREATE INDEX IF NOT EXISTS idx_poll_votes_user_id ON poll_votes(user_id);
