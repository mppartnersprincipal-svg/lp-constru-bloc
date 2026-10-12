-- Aviso de cookies (site/js/consent.js): quem escolhe "Só o essencial" no meio da visita
-- não fica com o id de visitante enviado nos lotes anteriores. Resto da função igual à 0001.
create or replace function public.construbloc_upsert_session(p jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.construbloc_sessions as s (
    id, visitor_id, landing_path, landing_page_type, referrer_host,
    utm_source, utm_medium, utm_campaign, utm_content, utm_term, gclid, channel,
    device, browser, os, screen_w, screen_h, city, region, country, consent, is_returning,
    duration_ms, max_scroll_pct, wa_clicks, phone_clicks
  ) values (
    (p->>'id')::uuid, p->>'visitor_id', p->>'landing_path', p->>'landing_page_type', p->>'referrer_host',
    p->>'utm_source', p->>'utm_medium', p->>'utm_campaign', p->>'utm_content', p->>'utm_term',
    coalesce((p->>'gclid')::boolean, false), p->>'channel',
    p->>'device', p->>'browser', p->>'os', (p->>'screen_w')::int, (p->>'screen_h')::int,
    p->>'city', p->>'region', p->>'country', p->>'consent', coalesce((p->>'returning')::boolean, false),
    (p->>'duration_ms')::int, (p->>'max_scroll_pct')::int,
    coalesce((p->>'wa_clicks')::int, 0), coalesce((p->>'phone_clicks')::int, 0)
  )
  on conflict (id) do update set
    last_seen_at   = now(),
    -- Se um lote posterior chegou antes do primeiro, a atribuição ainda não estava na linha
    landing_path      = coalesce(s.landing_path, excluded.landing_path),
    landing_page_type = coalesce(s.landing_page_type, excluded.landing_page_type),
    referrer_host     = coalesce(s.referrer_host, excluded.referrer_host),
    utm_source     = coalesce(s.utm_source, excluded.utm_source),
    utm_medium     = coalesce(s.utm_medium, excluded.utm_medium),
    utm_campaign   = coalesce(s.utm_campaign, excluded.utm_campaign),
    utm_content    = coalesce(s.utm_content, excluded.utm_content),
    utm_term       = coalesce(s.utm_term, excluded.utm_term),
    gclid          = s.gclid or excluded.gclid,
    channel        = coalesce(s.channel, excluded.channel),
    device         = coalesce(s.device, excluded.device),
    browser        = coalesce(s.browser, excluded.browser),
    os             = coalesce(s.os, excluded.os),
    screen_w       = coalesce(s.screen_w, excluded.screen_w),
    screen_h       = coalesce(s.screen_h, excluded.screen_h),
    city           = coalesce(s.city, excluded.city),
    region         = coalesce(s.region, excluded.region),
    country        = coalesce(s.country, excluded.country),
    is_returning   = s.is_returning or excluded.is_returning,
    -- "Só o essencial" no aviso de cookies apaga o id de visitante já gravado na sessão
    visitor_id     = case when excluded.consent = 'essential' then null else coalesce(excluded.visitor_id, s.visitor_id) end,
    consent        = coalesce(excluded.consent, s.consent),
    duration_ms    = greatest(coalesce(excluded.duration_ms, 0), coalesce(s.duration_ms, 0)),
    max_scroll_pct = greatest(coalesce(excluded.max_scroll_pct, 0), coalesce(s.max_scroll_pct, 0)),
    wa_clicks      = s.wa_clicks + coalesce(excluded.wa_clicks, 0),
    phone_clicks   = s.phone_clicks + coalesce(excluded.phone_clicks, 0);
end;
$$;

revoke all on function public.construbloc_upsert_session(jsonb) from public, anon, authenticated;
