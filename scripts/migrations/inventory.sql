-- One result set: some CLI versions display only the last result of a SQL file.
select jsonb_build_object(
 'captured_at',now(),
 'history_table',to_regclass('supabase_migrations.schema_migrations')::text,
 'relations',(select coalesce(jsonb_agg(jsonb_build_object('schema',n.nspname,'name',c.relname,'kind',c.relkind,'rls',c.relrowsecurity) order by n.nspname,c.relname),'[]'::jsonb) from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname in ('public','supabase_migrations') and c.relkind in ('r','p','v','m','f','S')),
 'public_functions',(select coalesce(jsonb_agg(jsonb_build_object('name',p.proname,'arguments',pg_get_function_identity_arguments(p.oid),'definition',pg_get_functiondef(p.oid),'owner',pg_get_userbyid(p.proowner),'acl',p.proacl::text) order by p.proname,p.oid),'[]'::jsonb) from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.prokind in ('f','p')),
 'extensions',(select jsonb_agg(jsonb_build_object('name',e.extname,'schema',n.nspname,'version',e.extversion) order by e.extname) from pg_extension e join pg_namespace n on n.oid=e.extnamespace),
 'buckets',(select coalesce(jsonb_agg(jsonb_build_object('id',id,'public',public,'file_size_limit',file_size_limit,'allowed_mime_types',allowed_mime_types) order by id),'[]'::jsonb) from storage.buckets),
 'policies',(select coalesce(jsonb_agg(jsonb_build_object('schema',schemaname,'table',tablename,'name',policyname,'roles',roles,'command',cmd,'qual',qual,'check',with_check) order by schemaname,tablename,policyname),'[]'::jsonb) from pg_policies where schemaname in ('public','storage')),
 'auth_users',(select count(*) from auth.users),
 'storage_objects',(select count(*) from storage.objects)
) as inventory;
