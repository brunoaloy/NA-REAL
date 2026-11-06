-- NA REAL Safe: all existing content is quarantined until reviewed.
create table public.safe_admins(user_id uuid primary key references auth.users on delete cascade);
create table public.safe_accounts(user_id uuid primary key references auth.users on delete cascade,suspended boolean not null default false,reason text not null default '');
create table public.user_blocks(blocker_id uuid not null references auth.users on delete cascade,blocked_id uuid not null references auth.users on delete cascade,created_at timestamptz not null default now(),primary key(blocker_id,blocked_id),check(blocker_id<>blocked_id));
create function public.safe_is_admin() returns boolean language sql stable security definer set search_path='' as $$select exists(select 1 from public.safe_admins where user_id=auth.uid()) and not exists(select 1 from public.safe_accounts where user_id=auth.uid() and suspended)$$;
create function public.safe_active() returns boolean language sql stable security definer set search_path='' as $$select auth.uid() is not null and not exists(select 1 from public.safe_accounts where user_id=auth.uid() and suspended)$$;
create function public.safe_visible(author uuid) returns boolean language sql stable security definer set search_path='' as $$select not exists(select 1 from public.safe_accounts where user_id=author and suspended) and not exists(select 1 from public.user_blocks where (blocker_id=auth.uid() and blocked_id=author) or (blocker_id=author and blocked_id=auth.uid()))$$;
revoke all on public.safe_admins,public.safe_accounts,public.user_blocks from anon,authenticated;
alter table public.safe_admins enable row level security;
alter table public.safe_accounts enable row level security;
alter table public.user_blocks enable row level security;
grant select on public.safe_accounts to authenticated;
create policy account_read on public.safe_accounts for select to authenticated using(user_id=auth.uid() or public.safe_is_admin());
grant select,delete on public.user_blocks to authenticated;
grant insert(blocker_id,blocked_id) on public.user_blocks to authenticated;
create policy blocks_owner on public.user_blocks to authenticated using(blocker_id=auth.uid()) with check(blocker_id=auth.uid() and public.safe_active());

alter table public.profiles add column handle text unique check(handle ~ '^[a-z0-9_]{3,30}$'),add column bio text not null default '' check(length(bio)<=300);
grant insert(handle,bio),update(handle,bio) on public.profiles to authenticated;
alter table public.places add column description text not null default '' check(length(description)<=1000),add column is_public_venue boolean not null default false;
grant insert(description,is_public_venue,geom) on public.places to authenticated;

create table public.photos(
 id uuid primary key default gen_random_uuid(),owner_id uuid not null references auth.users on delete cascade,
 place_id uuid references public.places on delete cascade,review_id uuid references public.reviews on delete cascade,
 object_path text not null unique,mime_type text not null default 'image/jpeg' check(mime_type='image/jpeg'),
 byte_size integer not null check(byte_size between 1 and 5242880),created_at timestamptz not null default now(),
 check(num_nonnulls(place_id,review_id)=1),check(object_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$'),check(split_part(object_path,'/',1)=owner_id::text)
);
alter table public.photos enable row level security;
revoke all on public.photos from anon,authenticated;
grant select on public.photos to anon,authenticated;
grant insert(owner_id,place_id,review_id,object_path,byte_size),delete on public.photos to authenticated;
create policy photos_read on public.photos for select using(true);
create policy photos_insert on public.photos for insert to authenticated with check(owner_id=auth.uid() and public.safe_active() and ((place_id is not null and exists(select 1 from public.places where id=place_id)) or (review_id is not null and exists(select 1 from public.reviews where id=review_id and author_id=auth.uid()))));
create policy photos_delete on public.photos for delete to authenticated using(owner_id=auth.uid());

create table public.live_reports(
 id uuid primary key default gen_random_uuid(),place_id uuid not null references public.places on delete cascade,author_id uuid not null references auth.users on delete cascade,
 kind text not null check(kind in ('movement','queue','open','parking')),value text not null check(value in ('quiet','moderate','busy','none','short','long','open','closed','available','full')),
 body text not null default '' check(length(body)<=500),created_at timestamptz not null default now(),expires_at timestamptz not null default now()+interval '30 minutes',
 check((kind='movement' and value in ('quiet','moderate','busy')) or(kind='queue' and value in ('none','short','long')) or(kind='open' and value in ('open','closed')) or(kind='parking' and value in ('available','full')))
);
create index live_reports_place on public.live_reports(place_id,expires_at);
alter table public.live_reports enable row level security;
revoke all on public.live_reports from anon,authenticated;
grant select on public.live_reports to anon,authenticated;
grant insert(place_id,author_id,kind,value,body),delete on public.live_reports to authenticated;
create policy live_read on public.live_reports for select using(expires_at>now() and exists(select 1 from public.places where id=place_id and verification_status='approved'));
create policy live_insert on public.live_reports for insert to authenticated with check(author_id=auth.uid() and public.safe_active() and exists(select 1 from public.places where id=place_id and verification_status='approved'));
create policy live_delete on public.live_reports for delete to authenticated using(author_id=auth.uid());
create table public.report_confirmations(report_id uuid not null references public.live_reports on delete cascade,user_id uuid not null references auth.users on delete cascade,agrees boolean not null,primary key(report_id,user_id));
alter table public.report_confirmations enable row level security;
revoke all on public.report_confirmations from anon,authenticated;
grant select on public.report_confirmations to anon,authenticated;
grant insert(report_id,user_id,agrees) on public.report_confirmations to authenticated;
create policy confirmations_read on public.report_confirmations for select using(exists(select 1 from public.live_reports where id=report_id));
create policy confirmations_write on public.report_confirmations for insert to authenticated with check(user_id=auth.uid() and public.safe_active() and exists(select 1 from public.live_reports where id=report_id and author_id<>auth.uid()));

create table public.place_follows(user_id uuid not null references auth.users on delete cascade,place_id uuid not null references public.places on delete cascade,primary key(user_id,place_id));
create table public.notification_preferences(user_id uuid primary key references auth.users on delete cascade,answers boolean not null default true,place_updates boolean not null default false,push boolean not null default false);
alter table public.place_follows enable row level security;
revoke all on public.place_follows from anon,authenticated;
grant select,insert,update,delete on public.place_follows to authenticated;
create policy owner on public.place_follows to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.safe_active());
alter table public.notification_preferences enable row level security;
revoke all on public.notification_preferences from anon,authenticated;
grant select,insert,update,delete on public.notification_preferences to authenticated;
create policy owner on public.notification_preferences to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid() and public.safe_active());

create table public.moderation_items(
 id uuid primary key default gen_random_uuid(),target_type text not null,target_id uuid not null,author_id uuid references auth.users on delete cascade,
 revision uuid not null,payload jsonb not null,state text not null default 'pending' check(state in ('pending','approved','rejected','removed','superseded')),
 requires_human boolean not null default false,provider text,analysis jsonb,attempted_at timestamptz,created_at timestamptz not null default now(),unique(target_type,target_id,revision)
);
create index moderation_queue on public.moderation_items(state,created_at);
create table public.moderation_actions(id uuid primary key default gen_random_uuid(),item_id uuid references public.moderation_items on delete cascade,actor_id uuid references auth.users on delete set null,decision text not null,reason text not null check(length(reason) between 3 and 1000),created_at timestamptz not null default now());
create table public.moderation_appeals(id uuid primary key default gen_random_uuid(),item_id uuid not null references public.moderation_items on delete cascade,author_id uuid not null references auth.users on delete cascade,reason text not null check(length(reason) between 5 and 1000),created_at timestamptz not null default now(),unique(item_id,author_id));
create table public.ugc_reports(id uuid primary key default gen_random_uuid(),reporter_id uuid not null references auth.users on delete cascade,target_type text not null check(target_type in ('places','profiles','reviews','place_messages','place_questions','question_answers','photos','live_reports')),target_id uuid not null,reason text not null check(length(reason) between 5 and 500),created_at timestamptz not null default now(),unique(reporter_id,target_type,target_id));
alter table public.moderation_items enable row level security; revoke all on public.moderation_items from anon,authenticated;
alter table public.moderation_actions enable row level security; revoke all on public.moderation_actions from anon,authenticated;
alter table public.moderation_appeals enable row level security; revoke all on public.moderation_appeals from anon,authenticated;
alter table public.ugc_reports enable row level security; revoke all on public.ugc_reports from anon,authenticated;
grant select on public.moderation_items,public.moderation_actions,public.moderation_appeals,public.ugc_reports to authenticated;
grant insert(item_id,author_id,reason) on public.moderation_appeals to authenticated;
grant insert(reporter_id,target_type,target_id,reason) on public.ugc_reports to authenticated;
create policy queue_read on public.moderation_items for select to authenticated using(author_id=auth.uid() or public.safe_is_admin());
create policy actions_read on public.moderation_actions for select to authenticated using(public.safe_is_admin() or exists(select 1 from public.moderation_items where id=item_id and author_id=auth.uid()));
create policy appeals_read on public.moderation_appeals for select to authenticated using(author_id=auth.uid() or public.safe_is_admin());
create policy appeals_write on public.moderation_appeals for insert to authenticated with check(author_id=auth.uid() and public.safe_active() and exists(select 1 from public.moderation_items where id=item_id and author_id=auth.uid() and state in ('rejected','removed')));
create policy ugc_read on public.ugc_reports for select to authenticated using(reporter_id=auth.uid() or public.safe_is_admin());
create policy ugc_write on public.ugc_reports for insert to authenticated with check(reporter_id=auth.uid() and public.safe_active());

create function public.safe_pending() returns trigger language plpgsql set search_path='' as $$begin new.moderation_state:='pending';new.content_revision:=gen_random_uuid();return new;end$$;
create function public.safe_enqueue() returns trigger language plpgsql security definer set search_path='' as $$
declare payload jsonb; author uuid;
begin
 payload:=to_jsonb(new)-'moderation_state'-'content_revision';
 author:=case tg_table_name when 'profiles' then new.id else null end;
 if tg_table_name='places' then author:=(payload->>'created_by')::uuid; elsif tg_table_name='photos' then author:=(payload->>'owner_id')::uuid;elsif tg_table_name<>'profiles' then author:=(payload->>'author_id')::uuid;end if;
 update public.moderation_items set state='superseded' where target_type=tg_table_name and target_id=new.id and state='pending';
 insert into public.moderation_items(target_type,target_id,author_id,revision,payload) values(tg_table_name,new.id,author,new.content_revision,payload);
 return new;
end$$;
revoke all on function public.safe_pending(),public.safe_enqueue() from public,anon,authenticated;
alter table public.profiles add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.profiles as restrictive for select using ((moderation_state='approved' and public.safe_visible(id)) or id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.profiles as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.profiles as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of display_name,handle,bio on public.profiles for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of display_name,handle,bio on public.profiles for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.profiles set display_name=display_name;
alter table public.places add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.places as restrictive for select using ((moderation_state='approved' and public.safe_visible(created_by)) or created_by=auth.uid() or public.safe_is_admin());
create policy safe_write on public.places as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.places as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of name,category,city,state,address,description,geom,is_public_venue on public.places for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of name,category,city,state,address,description,geom,is_public_venue on public.places for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.places set name=name;
alter table public.reviews add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.reviews as restrictive for select using ((moderation_state='approved' and public.safe_visible(author_id)) or author_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.reviews as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.reviews as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of rating,body on public.reviews for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of rating,body on public.reviews for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.reviews set rating=rating;
alter table public.place_messages add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.place_messages as restrictive for select using ((moderation_state='approved' and public.safe_visible(author_id)) or author_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.place_messages as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.place_messages as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of body on public.place_messages for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of body on public.place_messages for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.place_messages set body=body;
alter table public.place_questions add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.place_questions as restrictive for select using ((moderation_state='approved' and public.safe_visible(author_id)) or author_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.place_questions as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.place_questions as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of body,kind on public.place_questions for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of body,kind on public.place_questions for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.place_questions set body=body;
alter table public.question_answers add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.question_answers as restrictive for select using ((moderation_state='approved' and public.safe_visible(author_id)) or author_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.question_answers as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.question_answers as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of body on public.question_answers for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of body on public.question_answers for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.question_answers set body=body;
alter table public.photos add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.photos as restrictive for select using ((moderation_state='approved' and public.safe_visible(owner_id)) or owner_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.photos as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.photos as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of object_path on public.photos for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of object_path on public.photos for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.photos set object_path=object_path;
alter table public.live_reports add column moderation_state text not null default 'pending' check(moderation_state in ('pending','approved','rejected','removed')),add column content_revision uuid not null default gen_random_uuid();
create policy safe_read on public.live_reports as restrictive for select using ((moderation_state='approved' and public.safe_visible(author_id)) or author_id=auth.uid() or public.safe_is_admin());
create policy safe_write on public.live_reports as restrictive for insert to authenticated with check(public.safe_active() and moderation_state='pending');
create policy safe_update on public.live_reports as restrictive for update to authenticated using(public.safe_active()) with check(public.safe_active());
create trigger safe_prepare before insert or update of body,kind,value on public.live_reports for each row execute function public.safe_pending();
create trigger safe_queue after insert or update of body,kind,value on public.live_reports for each row execute function public.safe_enqueue();
-- Queue legacy content without claiming it was reviewed.
update public.live_reports set body=body;

-- Remove old immediate notifications; only an approved answer may notify.
drop trigger notify_answer on public.question_answers;
create function public.notify_approved_answer() returns trigger language plpgsql security definer set search_path='' as $$begin
 if new.moderation_state='approved' and old.moderation_state<>'approved' then
 insert into public.notifications(recipient_id,body,place_id)
 select q.author_id,'Sua pergunta recebeu uma resposta.',q.place_id from public.place_questions q
 where q.id=new.question_id and q.author_id<>new.author_id and q.moderation_state='approved' and not exists(select 1 from public.safe_accounts a where a.user_id=new.author_id and a.suspended) and not exists(select 1 from public.user_blocks b where (b.blocker_id=q.author_id and b.blocked_id=new.author_id) or (b.blocker_id=new.author_id and b.blocked_id=q.author_id))
 and not exists(select 1 from public.notification_preferences p where p.user_id=q.author_id and not p.answers);
 end if;return new;end$$;
revoke all on function public.notify_approved_answer() from public,anon,authenticated;
create trigger notify_approved after update of moderation_state on public.question_answers for each row execute function public.notify_approved_answer();

create function public.safe_apply(item uuid,decision text,reason text,provider_name text default null,result jsonb default null) returns boolean language plpgsql security definer set search_path='' as $$
declare job public.moderation_items; changed integer; legacy text;
begin
 if not public.safe_is_admin() and coalesce(nullif(current_setting('request.jwt.claim.role',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'role') is distinct from 'service_role' then raise exception 'Admin required' using errcode='42501';end if;
 if decision not in ('approved','rejected','removed','pending') or length(reason) not between 3 and 1000 then raise exception 'Invalid decision';end if;
 select * into job from public.moderation_items where id=item for update;
 if not found then raise exception 'Item missing';end if;
 if job.target_type not in ('profiles','places','reviews','place_messages','place_questions','question_answers','photos','live_reports') then raise exception 'Invalid target';end if;
 if job.state='superseded' or (provider_name is not null and job.state<>'pending') then return false;end if;
 -- Provider may approve only textual conversations; privacy-sensitive content requires human review.
 if provider_name is not null and decision='approved' and job.target_type in ('places','profiles','photos') then raise exception 'Human review required';end if;
 execute format('update public.%I set moderation_state=$1 where id=$2 and content_revision=$3',job.target_type) using decision,job.target_id,job.revision;
 get diagnostics changed=row_count;
 if changed=0 then update public.moderation_items set state='superseded' where id=item;return false;end if;
 if job.target_type='places' then
 if decision='approved' and not exists(select 1 from public.places where id=job.target_id and is_public_venue) then raise exception 'Public venue declaration required';end if;
 update public.places set verification_status=case when decision='approved' then 'approved' when decision='pending' then 'pending' else 'rejected' end where id=job.target_id;
 elsif job.target_type='reviews' then
 update public.reviews set status=case when decision='approved' then 'approved' when decision='pending' then 'pending' else 'hidden' end where id=job.target_id;
 end if;
 update public.moderation_items set state=decision,requires_human=(decision='pending'),provider=provider_name,analysis=result,attempted_at=now() where id=item;
 insert into public.moderation_actions(item_id,actor_id,decision,reason) values(item,auth.uid(),decision,reason);
 return true;
end$$;
revoke all on function public.safe_apply(uuid,text,text,text,jsonb) from public,anon,authenticated;
-- Human endpoint never accepts a provider verdict supplied by the client.
create function public.moderate_content(item uuid,decision text,reason text) returns boolean language plpgsql security definer set search_path='' as $$begin
 if not public.safe_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 return public.safe_apply(item,decision,reason,null,null);
end$$;
revoke all on function public.moderate_content(uuid,text,text) from public,anon;
grant execute on function public.moderate_content(uuid,text,text) to authenticated;
grant execute on function public.safe_apply(uuid,text,text,text,jsonb) to service_role;
create function public.suspend_account(target uuid,suspend boolean,reason text) returns void language plpgsql security definer set search_path='' as $$begin
 if not public.safe_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if length(reason) not between 3 and 1000 or target=auth.uid() then raise exception 'Invalid suspension';end if;
 insert into public.safe_accounts(user_id,suspended,reason) values(target,suspend,reason) on conflict(user_id) do update set suspended=excluded.suspended,reason=excluded.reason;
 insert into public.moderation_actions(decision,actor_id,reason) values(case when suspend then 'suspended' else 'reinstated' end,auth.uid(),target::text||': '||reason);
end$$;
revoke all on function public.suspend_account(uuid,boolean,text) from public,anon;
grant execute on function public.suspend_account(uuid,boolean,text) to authenticated;
-- Server-side global hourly budget, independent of deleted content.
create table public.safe_write_events(user_id uuid not null references auth.users on delete cascade,created_at timestamptz not null default now());
create index safe_write_budget on public.safe_write_events(user_id,created_at);
alter table public.safe_write_events enable row level security;
revoke all on public.safe_write_events from public,anon,authenticated;
create function public.safe_budget() returns trigger language plpgsql security definer set search_path='' as $$begin
 if auth.uid() is null then return new;end if;
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,1));
 if (select count(*) from public.safe_write_events where user_id=auth.uid() and created_at>now()-interval '1 hour')>=60 then raise exception 'Limite de contribuições por hora atingido';end if;
 insert into public.safe_write_events(user_id) values(auth.uid());return new;
end$$;
revoke all on function public.safe_budget() from public,anon,authenticated;
create trigger safe_budget before insert or update on public.profiles for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.places for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.reviews for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.place_messages for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.place_questions for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.question_answers for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.photos for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.live_reports for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.moderation_appeals for each row execute function public.safe_budget();
create trigger safe_budget before insert or update on public.ugc_reports for each row execute function public.safe_budget();
grant select,update on public.moderation_items to service_role;
revoke all on function public.safe_is_admin(),public.safe_active(),public.safe_visible(uuid) from public;
grant execute on function public.safe_is_admin(),public.safe_active(),public.safe_visible(uuid) to anon,authenticated,service_role;
