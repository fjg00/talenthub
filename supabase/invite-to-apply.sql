-- Add invite_to_apply to notification_type enum
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'invite_to_apply';
