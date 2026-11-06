-- Disposable Postgres only. Emulates Supabase JWT identity; not a Supabase integration test.
create role anon nologin;
create role authenticated nologin;
create schema auth;
create schema extensions;
create table auth.users(id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
grant usage on schema auth,public,extensions to anon,authenticated;
grant execute on function auth.uid() to anon,authenticated;
create publication supabase_realtime;

create role service_role nologin bypassrls;
create schema storage;
create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
alter table storage.objects enable row level security;
grant usage on schema storage to anon,authenticated,service_role;
grant select,insert,delete on storage.objects to anon,authenticated;
