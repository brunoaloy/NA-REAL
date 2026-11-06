create table public.favorites(user_id uuid references auth.users on delete cascade,place_id uuid references public.places on delete cascade,primary key(user_id,place_id));
create table public.place_questions(
 id uuid primary key default gen_random_uuid(),place_id uuid not null references public.places on delete cascade,
 author_id uuid not null references auth.users on delete cascade,
 kind text not null check(kind in ('movement','queue','open','parking','other')),
 body text not null check(length(trim(body)) between 3 and 500),created_at timestamptz not null default now(),
 expires_at timestamptz not null default now()+interval '60 minutes'
);
create table public.question_answers(
 id uuid primary key default gen_random_uuid(),question_id uuid not null references public.place_questions on delete cascade,
 author_id uuid not null references auth.users on delete cascade,
 body text not null check(length(trim(body)) between 1 and 500),created_at timestamptz not null default now()
);
create table public.notifications(
 id uuid primary key default gen_random_uuid(),recipient_id uuid not null references auth.users on delete cascade,
 body text not null,place_id uuid references public.places on delete cascade,read_at timestamptz,created_at timestamptz not null default now()
);
create table public.content_reports(
 id uuid primary key default gen_random_uuid(),reporter_id uuid not null references auth.users on delete cascade,
 place_id uuid not null references public.places on delete cascade,
 reason text not null check(length(trim(reason)) between 5 and 500),status text not null default 'pending' check(status in ('pending','resolved')),
 created_at timestamptz not null default now(),unique(reporter_id,place_id)
);
create index questions_place on public.place_questions(place_id,created_at desc);
create index answers_question on public.question_answers(question_id,created_at desc);
create index notifications_recipient on public.notifications(recipient_id,created_at desc);
revoke all on public.favorites,public.place_questions,public.question_answers,public.notifications,public.content_reports from anon,authenticated;
alter table public.favorites enable row level security;
alter table public.place_questions enable row level security;
alter table public.question_answers enable row level security;
alter table public.notifications enable row level security;
alter table public.content_reports enable row level security;
grant select,delete on public.favorites to authenticated;
grant insert(user_id,place_id) on public.favorites to authenticated;
create policy favorite_owner on public.favorites to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
grant select on public.place_questions,public.question_answers to anon,authenticated;
grant insert(place_id,author_id,kind,body) on public.place_questions to authenticated;
grant insert(question_id,author_id,body) on public.question_answers to authenticated;
create policy question_read on public.place_questions for select using(exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy question_write on public.place_questions for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.places p where p.id=place_id and p.verification_status='approved'));
create policy answer_read on public.question_answers for select using(exists(select 1 from public.place_questions q where q.id=question_id));
create policy answer_write on public.question_answers for insert to authenticated with check(author_id=auth.uid() and exists(select 1 from public.place_questions q where q.id=question_id and q.expires_at>now()));
grant select on public.notifications to authenticated;
grant update(read_at) on public.notifications to authenticated;
create policy notification_owner_read on public.notifications for select to authenticated using(recipient_id=auth.uid());
create policy notification_owner_update on public.notifications for update to authenticated using(recipient_id=auth.uid()) with check(recipient_id=auth.uid());
grant insert(reporter_id,place_id,reason),select on public.content_reports to authenticated;
create policy report_write on public.content_reports for insert to authenticated with check(reporter_id=auth.uid() and status='pending');
create policy report_read on public.content_reports for select to authenticated using(reporter_id=auth.uid());
create function public.notify_question_answer() returns trigger language plpgsql security definer set search_path='' as $$
begin
 insert into public.notifications(recipient_id,body,place_id)
 select author_id,'Sua pergunta recebeu uma resposta.',place_id from public.place_questions where id=new.question_id and author_id<>new.author_id;
 return new;
end $$;
revoke all on function public.notify_question_answer() from public,anon,authenticated;
create trigger notify_answer after insert on public.question_answers for each row execute function public.notify_question_answer();
-- Shared limit across questions/answers/reports. No caller-provided timestamps.
create function public.limit_community() returns trigger language plpgsql security definer set search_path='' as $$
declare n integer;
begin
 perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtextextended(auth.uid()::text,0));
 select (select count(*) from public.place_questions where author_id=auth.uid() and created_at>now()-interval '1 hour')+(select count(*) from public.question_answers where author_id=auth.uid() and created_at>now()-interval '1 hour')+(select count(*) from public.content_reports where reporter_id=auth.uid() and created_at>now()-interval '1 hour') into n;
 if n>=30 then raise exception 'Limite de contribuições por hora atingido'; end if;
 return new;
end $$;
revoke all on function public.limit_community() from public,anon,authenticated;
create trigger limit_questions before insert on public.place_questions for each row execute function public.limit_community();
create trigger limit_answers before insert on public.question_answers for each row execute function public.limit_community();
create trigger limit_reports before insert on public.content_reports for each row execute function public.limit_community();
alter publication supabase_realtime add table public.place_questions,public.question_answers,public.notifications;
