-- Run only AFTER a successful CLI push. Every statement is read-only.
-- Missing history table is a failure: do not create it by hand.
select e.version,m.version is not null as applied,m.name
 from (values
 ('202611060001'),
 ('202611060002'),
 ('202611060003'),
 ('202611060004'),
 ('202611060005'),
 ('202611060006'),
 ('202611060007'),
 ('202611060008'),
 ('202611060009'),
 ('202611060010')
 ) e(version) left join supabase_migrations.schema_migrations m using(version) order by e.version;
-- Unexpected versions require investigation, never automatic repair.
select m.version,m.name from supabase_migrations.schema_migrations m
 where m.version not in (select version from (values
 ('202611060001'),
 ('202611060002'),
 ('202611060003'),
 ('202611060004'),
 ('202611060005'),
 ('202611060006'),
 ('202611060007'),
 ('202611060008'),
 ('202611060009'),
 ('202611060010')
 ) e(version)) order by m.version;
select e.name,to_regclass('public.'||e.name) is not null as present,coalesce(c.relrowsecurity,false) as rls
 from (values
 ('account_appeals'),
 ('content_reports'),
 ('favorites'),
 ('live_reports'),
 ('moderation_actions'),
 ('moderation_appeals'),
 ('moderation_items'),
 ('notification_preferences'),
 ('notifications'),
 ('photos'),
 ('place_change_suggestions'),
 ('place_follows'),
 ('place_messages'),
 ('place_questions'),
 ('places'),
 ('profiles'),
 ('question_answers'),
 ('report_confirmations'),
 ('reviews'),
 ('safe_accounts'),
 ('safe_admins'),
 ('safe_write_events'),
 ('ugc_reports'),
 ('user_blocks')
 ) e(name) left join pg_namespace n on n.nspname='public'
 left join pg_class c on c.relnamespace=n.oid and c.relname=e.name and c.relkind='r' order by e.name;
select extname,extversion,n.nspname as schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace
 where extname in ('postgis','pg_trgm','unaccent') order by extname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets
 where id in ('community-photos','reviewed-photos') order by id;
select to_regprocedure('public.search_places(text,text,text,text,integer,double precision,double precision,double precision,double precision)') is not null as national_search,
 to_regprocedure('public.search_places_near(double precision,double precision,text,text,text,text,integer)') is not null as proximity_search,
 to_regclass('public.reviews_place_cursor') is not null as review_cursor_index;
select has_function_privilege('anon','public.search_places_near(double precision,double precision,text,text,text,text,integer)','execute') as visitor_search,
 has_table_privilege('anon','public.places','insert') as visitor_insert,
 has_table_privilege('authenticated','public.safe_admins','insert') as client_admin_escalation;
select count(*) as visible_catalogue_rows from public.search_places('', 'Todos', '', '', 0);
-- This structural check does NOT replace tests as guest/A/B/moderator.
