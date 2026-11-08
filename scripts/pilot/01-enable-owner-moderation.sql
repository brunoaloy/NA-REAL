-- Execute no SQL Editor do projeto NA REAL (zcnfssihiqmbrlwvlsme).
-- Conta confirmada identificada pelo proprietário em 08/11/2026.
-- Não é uma migration: alteração operacional específica, autorizada pelo proprietário.
begin;
do $$
declare owner_id uuid := 'c8c2eedf-675d-47fc-89c0-e02b8645bac5';
begin
  if not exists(select 1 from auth.users where id=owner_id and email_confirmed_at is not null) then
    raise exception 'Conta confirmada não encontrada; nenhuma permissão alterada';
  end if;
  if exists(select 1 from public.safe_accounts where user_id=owner_id and suspended) then
    raise exception 'Conta suspensa; nenhuma permissão alterada';
  end if;
  insert into public.safe_admins(user_id) values(owner_id) on conflict(user_id) do nothing;
end $$;
select exists(select 1 from public.safe_admins where user_id='c8c2eedf-675d-47fc-89c0-e02b8645bac5') as moderator_enabled;
commit;
