select cron.schedule(
  'trackindia-backfill-ai',
  '* * * * *',
  $$
  select net.http_post(
    url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/backfill-ai?limit=50',
    headers := '{"Content-Type": "application/json", "apikey": "sb_publishable_9NICEygPRYyS4MhxhcuK0A_Nejmpqkv"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);