-- Read-only inventory. No credentials, personal records or row bodies are returned.
select current_database() as database_name,current_user,
 current_setting('transaction_read_only') as transaction_read_only,
 to_regclass('supabase_migrations.schema_migrations')::text as history_table;
select n.nspname as schema,c.relname,c.relkind,c.relrowsecurity as rls
 from pg_catalog.pg_class c join pg_catalog.pg_namespace n on n.oid=c.relnamespace
 where n.nspname in ('public','supabase_migrations') and c.relkind in ('r','p','v','m','f') order by 1,2;
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments
 from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' order by 1,2;
select extname,extversion,n.nspname as schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace order by extname;
select id,public,file_size_limit,allowed_mime_types from storage.buckets order by id;
select policyname,cmd from pg_policies where schemaname='storage' and tablename='objects' order by policyname;
select pubname,schemaname,tablename from pg_publication_tables where pubname='supabase_realtime' order by 2,3;
select (select count(*) from auth.users) as auth_users,(select count(*) from storage.objects) as storage_objects;
-- The CLI migration list command reads the ledger when it exists. Do not create or repair it manually.
