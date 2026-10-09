-- Durable per-user quota for the authenticated article Q&A route.
create table if not exists public.ai_question_quotas (
  user_id uuid not null references auth.users(id) on delete cascade,
  usage_day date not null,
  questions_used integer not null default 0 check (questions_used between 0 and 10),
  primary key (user_id, usage_day)
);

alter table public.ai_question_quotas enable row level security;
revoke all on table public.ai_question_quotas from public, anon, authenticated;
grant all on table public.ai_question_quotas to service_role;

create or replace function public.consume_ai_question_quota(p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_consumed boolean;
begin
  insert into public.ai_question_quotas (user_id, usage_day, questions_used)
  values (p_user_id, (pg_catalog.now() at time zone 'UTC')::date, 1)
  on conflict (user_id, usage_day)
  do update
    set questions_used = public.ai_question_quotas.questions_used + 1
    where public.ai_question_quotas.questions_used < 10
  returning true into v_consumed;

  return case when v_consumed is null then false else v_consumed end;
end;
$function$;

revoke all on function public.consume_ai_question_quota(uuid) from public, anon, authenticated;
grant execute on function public.consume_ai_question_quota(uuid) to service_role;

-- Replace cron jobs so they send the Vault value at run time. Never embed the
-- shared secret in the stored cron command. Add the same CRON_SECRET to the
-- Lovable server environment and Supabase Vault before enabling this schedule.
do $block$
declare
  v_job record;
begin
  for v_job in
    select jobid
    from cron.job
    where jobname in ('trackindia-market-refresh', 'trackindia-backfill-ai', 'trackindia-ipo-alerts')
  loop
    perform cron.unschedule(v_job.jobid);
  end loop;
end;
$block$;

select cron.schedule(
  'trackindia-market-refresh',
  '*/5 * * * *',
  $command$
    select net.http_post(
      url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/ingest-rss',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1), '')
      ),
      body := '{}'::jsonb
    );
    select net.http_post(
      url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/refresh-tickers',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1), '')
      ),
      body := '{}'::jsonb
    );
  $command$
);

select cron.schedule(
  'trackindia-backfill-ai',
  '* * * * *',
  $command$
    select net.http_post(
      url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/backfill-ai?limit=50',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1), '')
      ),
      body := '{}'::jsonb
    );
  $command$
);

select cron.schedule(
  'trackindia-ipo-alerts',
  '*/15 * * * *',
  $command$
    select net.http_post(
      url := 'https://project--cdea9cdf-8b30-4ec3-aa0a-7273c2f53d6c.lovable.app/api/public/ipo-alerts',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'x-cron-secret', coalesce((select decrypted_secret from vault.decrypted_secrets where name = 'CRON_SECRET' limit 1), '')
      ),
      body := '{}'::jsonb
    );
  $command$
);
