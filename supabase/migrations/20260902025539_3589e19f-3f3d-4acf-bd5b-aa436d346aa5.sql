select cron.unschedule('trackindia-ipo-alerts') where exists (select 1 from cron.job where jobname = 'trackindia-ipo-alerts');

select cron.schedule(
  'trackindia-ipo-alerts',
  '*/15 * * * *',
  $$
  select net.http_post(
    url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/ipo-alerts',
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := '{}'::jsonb
  );
  $$
);