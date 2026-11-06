-- One result set, read-only. Fails naturally if required tables/RPCs are absent.
select jsonb_build_object(
 'history_complete',(select count(*)=10 and bool_and(version in ('202611060001','202611060002','202611060003','202611060004','202611060005','202611060006','202611060007','202611060008','202611060009','202611060010')) from supabase_migrations.schema_migrations),
 'tables_and_rls',not exists(select 1 from (values ('profiles'),('places'),('reviews'),('place_messages'),('favorites'),('place_questions'),('question_answers'),('notifications'),('content_reports'),('safe_admins'),('safe_accounts'),('user_blocks'),('photos'),('live_reports'),('report_confirmations'),('place_follows'),('notification_preferences'),('moderation_items'),('moderation_actions'),('moderation_appeals'),('ugc_reports'),('safe_write_events'),('account_appeals'),('place_change_suggestions')) e(name) where not exists(select 1 from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relname=e.name and c.relkind='r' and c.relrowsecurity)),
 'extensions',(select count(*)=3 from pg_extension where extname in ('postgis','pg_trgm','unaccent')),
 'private_buckets',(select count(*)=2 and bool_and(not public and file_size_limit=5242880 and allowed_mime_types=array['image/jpeg']) from storage.buckets where id in ('community-photos','reviewed-photos')),
 'rpc_national',to_regprocedure('public.search_places(text,text,text,text,integer,double precision,double precision,double precision,double precision)') is not null,
 'rpc_proximity',to_regprocedure('public.search_places_near(double precision,double precision,text,text,text,text,integer)') is not null,
 'review_cursor',to_regclass('public.reviews_place_cursor') is not null,
 'visitor_search',has_function_privilege('anon','public.search_places_near(double precision,double precision,text,text,text,text,integer)','execute'),
 'visitor_cannot_insert',not has_table_privilege('anon','public.places','insert'),
 'client_cannot_become_admin',not has_table_privilege('authenticated','public.safe_admins','insert')
) as checks;
