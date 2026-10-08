alter table public.alert_settings
  add column if not exists ipo_announce_enabled boolean not null default false;
