-- Geographic catalogue: bounded, paginated, and subject to caller RLS.
create or replace view public.place_ratings with(security_invoker=true) as select place_id,avg(rating)::numeric(3,2) as rating,count(*) as review_count from public.reviews where status='approved' and moderation_state='approved' group by place_id;
create function public.search_places(term text default '',category_filter text default 'Todos',city_filter text default '',state_filter text default '',page_number integer default 0,west double precision default -74,south double precision default -34,east double precision default -34,north double precision default 6) returns table(id uuid,name text,category text,city text,state text,address text,longitude double precision,latitude double precision,rating numeric,review_count bigint) language plpgsql stable set search_path='' as $$
begin
 if length(term)>120 or length(city_filter)>100 or page_number not between 0 and 500 or west < -180 or east>180 or south < -90 or north>90 or west>=east or south>=north then raise exception 'Invalid search bounds';end if;
 return query select p.id,p.name,p.category,p.city,p.state,p.address,extensions.st_x(p.geom::extensions.geometry),extensions.st_y(p.geom::extensions.geometry),r.rating,coalesce(r.review_count,0)
 from public.places p left join public.place_ratings r on r.place_id=p.id
 where p.moderation_state='approved' and p.verification_status='approved'
 and (term='' or p.name ilike '%'||replace(replace(term,'%','\\%'),'_','\\_')||'%' or p.city ilike '%'||replace(replace(term,'%','\\%'),'_','\\_')||'%')
 and (category_filter='Todos' or p.category=category_filter) and(city_filter='' or p.city ilike '%'||city_filter||'%') and(state_filter='' or p.state=state_filter)
 and (p.geom is null or extensions.st_intersects(p.geom::extensions.geometry,extensions.st_makeenvelope(west,south,east,north,4326)))
 order by p.name,p.id limit 50 offset page_number*50;
end$$;
revoke all on function public.search_places(text,text,text,text,integer,double precision,double precision,double precision,double precision) from public;
grant execute on function public.search_places(text,text,text,text,integer,double precision,double precision,double precision,double precision) to anon,authenticated;
create function public.place_duplicate_guard() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if not new.is_public_venue then raise exception 'Confirme que é estabelecimento público';end if;
 if new.geom is not null and (extensions.st_y(new.geom::extensions.geometry) not between -34 and 6 or extensions.st_x(new.geom::extensions.geometry) not between -74 and -34) then raise exception 'Posição fora da área brasileira suportada';end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(lower(trim(new.name))||lower(trim(new.city))||new.state,2));
 if exists(select 1 from public.places p where p.verification_status in ('pending','approved') and lower(trim(p.name))=lower(trim(new.name)) and lower(trim(p.city))=lower(trim(new.city)) and p.state=new.state and (p.geom is null or new.geom is null or extensions.st_dwithin(p.geom,new.geom,150))) then raise exception 'Lugar semelhante já cadastrado ou aguardando revisão. Pesquise antes de enviar.';end if;
 return new;
end$$;
revoke all on function public.place_duplicate_guard() from public,anon,authenticated;
create trigger duplicate_guard before insert on public.places for each row execute function public.place_duplicate_guard();

insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('community-photos','community-photos',false,5242880,array['image/jpeg']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg'];
create policy community_photo_upload on storage.objects for insert to authenticated with check(bucket_id='community-photos' and public.safe_active() and exists(select 1 from public.photos p where p.object_path=name and p.owner_id=auth.uid() and p.moderation_state='pending'));
create policy community_photo_read on storage.objects for select to anon,authenticated using(bucket_id='community-photos' and exists(select 1 from public.photos p where p.object_path=name and (p.owner_id=auth.uid() or public.safe_is_admin() or(p.moderation_state='approved' and public.safe_visible(p.owner_id)))));
create policy community_photo_delete on storage.objects for delete to authenticated using(bucket_id='community-photos' and exists(select 1 from public.photos p where p.object_path=name and p.owner_id=auth.uid()));
-- Admin visibility is granted only by protected membership.
create policy admin_read on public.profiles for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.places for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.reviews for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.place_messages for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.place_questions for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.question_answers for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.photos for select to authenticated using(public.safe_is_admin());
create policy admin_read on public.live_reports for select to authenticated using(public.safe_is_admin());
-- Public media cannot bypass a parent's removal or moderation.
create policy photo_parent_read on public.photos as restrictive for select using(owner_id=auth.uid() or public.safe_is_admin() or ((place_id is not null and exists(select 1 from public.places p where p.id=place_id and p.moderation_state='approved' and p.verification_status='approved')) or(review_id is not null and exists(select 1 from public.reviews r where r.id=review_id and r.moderation_state='approved' and r.status='approved'))));
alter table public.notifications add column source_key text unique;
create or replace function public.notify_approved_answer() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.moderation_state='approved' and old.moderation_state<>'approved' then
 insert into public.notifications(recipient_id,body,place_id,source_key)
 select q.author_id,'Sua pergunta recebeu uma resposta.',q.place_id,'answer:'||new.id::text||':'||new.content_revision::text from public.place_questions q
 where q.id=new.question_id and q.author_id<>new.author_id and q.moderation_state='approved'
 and not exists(select 1 from public.safe_accounts a where a.user_id=new.author_id and a.suspended)
 and not exists(select 1 from public.user_blocks b where (b.blocker_id=q.author_id and b.blocked_id=new.author_id) or (b.blocker_id=new.author_id and b.blocked_id=q.author_id))
 and not exists(select 1 from public.notification_preferences p where p.user_id=q.author_id and not p.answers)
 on conflict(source_key) do nothing;
 end if;return new;end$$;

-- Media must have a server sanitation receipt before human approval.
alter table public.photos add column sanitized_at timestamptz;
create function public.safe_photo_approval() returns trigger language plpgsql set search_path='' as $$begin
 if new.moderation_state='approved' and new.sanitized_at is null then raise exception 'Server image sanitation required before approval';end if;return new;
end$$;
revoke all on function public.safe_photo_approval() from public,anon,authenticated;
create trigger safe_photo_approval before update of moderation_state on public.photos for each row execute function public.safe_photo_approval();
grant select,update(sanitized_at) on public.photos to service_role;

-- Reviewed pixels are immutable to clients, isolated from mutable staging uploads.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('reviewed-photos','reviewed-photos',false,5242880,array['image/jpeg']) on conflict(id) do update set public=false,file_size_limit=5242880,allowed_mime_types=array['image/jpeg'];
create policy reviewed_photo_read on storage.objects for select to anon,authenticated using(bucket_id='reviewed-photos' and exists(select 1 from public.photos p where p.owner_id::text||'/'||p.content_revision::text||'.jpg'=name and (p.owner_id=auth.uid() or public.safe_is_admin() or(p.moderation_state='approved' and public.safe_visible(p.owner_id)))));
-- Staging bytes are never public, even after approving their sanitized derivative.
drop policy community_photo_read on storage.objects;
create policy community_photo_read on storage.objects for select to authenticated using(bucket_id='community-photos' and exists(select 1 from public.photos p where p.object_path=name and (p.owner_id=auth.uid() or public.safe_is_admin())));
