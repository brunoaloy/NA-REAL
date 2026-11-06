-- Suspended accounts can request human review without regaining posting rights.
create table public.account_appeals(user_id uuid primary key references auth.users on delete cascade,reason text not null check(length(trim(reason)) between 5 and 1000),created_at timestamptz not null default now());
alter table public.account_appeals enable row level security;
revoke all on public.account_appeals from public,anon,authenticated;
grant select on public.account_appeals to authenticated;
grant insert(user_id,reason) on public.account_appeals to authenticated;
create policy account_appeal_read on public.account_appeals for select to authenticated using(user_id=auth.uid() or public.safe_is_admin());
create policy account_appeal_insert on public.account_appeals for insert to authenticated with check(user_id=auth.uid() and exists(select 1 from public.safe_accounts a where a.user_id=auth.uid() and a.suspended));
create trigger safe_budget before insert on public.account_appeals for each row execute function public.safe_budget();
