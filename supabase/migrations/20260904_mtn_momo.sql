-- Adds MTN MoMo tracking columns to deposits (brand -> platform) and
-- withdrawals (platform -> influencer). Existing Pesapal columns, if any,
-- are left in place for historical records.

alter table deposits
  add column if not exists phone text,
  add column if not exists momo_reference_id text,
  add column if not exists momo_external_id text,
  add column if not exists momo_status text;

create unique index if not exists deposits_momo_reference_id_idx
  on deposits (momo_reference_id) where momo_reference_id is not null;

alter table withdrawals
  add column if not exists momo_reference_id text,
  add column if not exists momo_external_id text,
  add column if not exists momo_status text;

create unique index if not exists withdrawals_momo_reference_id_idx
  on withdrawals (momo_reference_id) where momo_reference_id is not null;

-- 'processing' sits between 'pending' (requested) and 'approved'/'rejected'
-- (final MTN MoMo outcome) for withdrawals. If withdrawals.status has a
-- check constraint limiting allowed values, extend it to include
-- 'processing' as well, e.g.:
--   alter table withdrawals drop constraint if exists withdrawals_status_check;
--   alter table withdrawals add constraint withdrawals_status_check
--     check (status in ('pending','processing','approved','rejected'));
