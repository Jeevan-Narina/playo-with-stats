-- ============================================================
-- PLAYO WITH STATS - PROFILE PHOTO DATABASE FIX
-- ============================================================
-- Purpose:
-- Adds the MIME type column required by the profile upload API.
-- Run once on a database missing this column.
-- Do not rerun if the column already exists.
-- ============================================================

USE playo_db;

ALTER TABLE `user`
ADD COLUMN profile_photo_type VARCHAR(50) NULL;
