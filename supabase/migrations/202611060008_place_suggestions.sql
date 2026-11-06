create table public.place_change_suggestions(
 id uuid primary key default gen_random_uuid(),place_id uuid not null references public.places on delete cascade,
 author_id uuid not null references auth.users on delete cascade,expected_revision uuid not null,
 field text not null check(field in ('name','address','description','city','state','category')),
 proposed_value text not null,reason text not null check(length(trim(reason)) between 5 and 500),
 status text not null default 'pending' check(status in ('pending','approved','rejected')),
 decision_reason text,created_at timestamptz not null default now(),reviewed_at timestamptz,
 check((field='name' and length(trim(proposed_value)) between 3 and 120) or(field='address' and length(trim(proposed_value)) between 5 and 240) or(field='description' and length(proposed_value)<=1000) or(field='city' and length(trim(proposed_value)) between 2 and 100) or(field='state' and proposed_value ~ '^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$') or(field='category' and proposed_value in ('Comer','Lazer','Compras','Serviços')))
);
create index suggestions_pending on public.place_change_suggestions(status,created_at,id);
alter table public.place_change_suggestions enable row level security;
revoke all on public.place_change_suggestions from public,anon,authenticated;
grant select on public.place_change_suggestions to authenticated;
grant insert(place_id,author_id,expected_revision,field,proposed_value,reason) on public.place_change_suggestions to authenticated;
create policy suggestion_read on public.place_change_suggestions for select to authenticated using(author_id=auth.uid() or public.safe_is_admin());
create policy suggestion_write on public.place_change_suggestions for insert to authenticated with check(author_id=auth.uid() and public.safe_active() and status='pending' and exists(select 1 from public.places p where p.id=place_id and p.moderation_state='approved' and p.verification_status='approved' and p.content_revision=expected_revision));
create trigger safe_budget before insert on public.place_change_suggestions for each row execute function public.safe_budget();
create function public.review_place_suggestion(suggestion uuid,approve boolean,reason text) returns void language plpgsql security definer set search_path='' as $$
declare s public.place_change_suggestions;p public.places;job uuid;new_name text;new_city text;new_state text;
begin
 if not public.safe_is_admin() then raise exception 'Admin required' using errcode='42501';end if;
 if reason is null or length(trim(reason)) not between 3 and 1000 then raise exception 'Decision reason required';end if;
 select * into s from public.place_change_suggestions where id=suggestion for update;
 if not found or s.status<>'pending' then raise exception 'Suggestion unavailable';end if;
 if approve then
 select * into p from public.places where id=s.place_id for update;
 if p.content_revision<>s.expected_revision or p.moderation_state<>'approved' then raise exception 'O lugar foi alterado. Revise uma nova sugestão.';end if;
 new_name:=case when s.field='name' then s.proposed_value else p.name end;
 new_city:=case when s.field='city' then s.proposed_value else p.city end;
 new_state:=case when s.field='state' then s.proposed_value else p.state end;
 if exists(select 1 from public.places other where other.id<>p.id and other.verification_status in ('pending','approved') and other.normalized_name=public.normalize_place_name(new_name) and lower(other.city)=lower(new_city) and other.state=new_state and(other.geom is null or p.geom is null or extensions.st_dwithin(other.geom,p.geom,150))) then raise exception 'Possível duplicata: correção não aplicada';end if;
 if s.field not in ('name','address','description','city','state','category') then raise exception 'Invalid field';end if;
 execute format('update public.places set %I=$1 where id=$2',s.field) using s.proposed_value,s.place_id;
 select mi.id into job from public.moderation_items mi join public.places place on place.id=mi.target_id and place.content_revision=mi.revision where mi.target_type='places' and place.id=s.place_id;
 perform public.safe_apply(job,'approved',reason,null,null);
 end if;
 update public.place_change_suggestions set status=case when approve then 'approved' else 'rejected' end,decision_reason=$3,reviewed_at=now() where id=suggestion;
 insert into public.moderation_actions(actor_id,decision,reason) values(auth.uid(),case when approve then 'correction_approved' else 'correction_rejected' end,suggestion::text||': '||reason);
end$$;
revoke all on function public.review_place_suggestion(uuid,boolean,text) from public,anon;
grant execute on function public.review_place_suggestion(uuid,boolean,text) to authenticated;
