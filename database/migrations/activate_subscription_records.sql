-- Migration: activate_subscription_records
-- Date: 2026-07-09
-- Description: Reactivate historical subscription records that were left inactive by earlier UI behavior

UPDATE subscription_records
SET status = 'active'
WHERE status = 'inactive';
