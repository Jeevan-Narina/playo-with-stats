
-- Playo with Stats: Host Feature Migration
-- Run once on databases that do not yet have these columns.

USE playo_db;

-- Allow accounts to have user or host roles.
ALTER TABLE `user`
ADD COLUMN role ENUM('user', 'host')
NOT NULL DEFAULT 'user';

-- Associate venues with their host accounts.
ALTER TABLE venue
ADD COLUMN host_user_id INT NULL,
ADD CONSTRAINT fk_venue_host
FOREIGN KEY (host_user_id)
REFERENCES `user`(user_id)
ON DELETE SET NULL
ON UPDATE CASCADE;

-- Host accounts and venue assignments must be
-- configured separately for each database.
-- Do not assume user_id = 12 or venue_id = 17.
