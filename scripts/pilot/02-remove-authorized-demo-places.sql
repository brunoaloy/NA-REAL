-- Somente os dois "Samy" de Osório/RS identificados pelo proprietário como demonstração.
-- Execute no SQL Editor do projeto NA REAL após remover a foto vinculada via
-- aplicativo (Perfil > Minhas fotos) ou Storage API/dashboard. Não apague arquivos por SQL.
-- Este script para integralmente se arquivos ainda estiverem registrados no Storage.
begin;
do $$
declare
  owner_id uuid := 'c8c2eedf-675d-47fc-89c0-e02b8645bac5';
  demos uuid[] := array['cbdc7dd0-6080-4c2b-a0f4-00f412db2ed3','d218cd3a-ef67-4d04-8a02-7406b53fbb8f']::uuid[];
begin
  if exists(select 1 from public.places where id=any(demos) and
      (created_by is distinct from owner_id or name<>'Samy' or city<>'Osório' or state<>'RS')) then
    raise exception 'Os cadastros mudaram; interrompido para revisão';
  end if;
  if exists(select 1 from public.photos p join storage.objects o on
      (o.bucket_id='community-photos' and o.name=p.object_path) or
      (o.bucket_id='reviewed-photos' and o.name=p.owner_id::text||'/'||p.content_revision::text||'.jpg')
      where p.place_id=any(demos) or p.review_id in(select id from public.reviews where place_id=any(demos))) then
    raise exception 'Remova primeiro os arquivos das fotos de demonstração pelo app ou Storage API/dashboard; nada foi apagado';
  end if;
  if exists(select 1 from public.reviews where place_id=any(demos)) or
     exists(select 1 from public.place_messages where place_id=any(demos)) or
     exists(select 1 from public.place_questions where place_id=any(demos)) or
     exists(select 1 from public.live_reports where place_id=any(demos)) then
    raise exception 'Há novas contribuições vinculadas; interrompido para revisão';
  end if;
  delete from public.moderation_items where target_type='photos' and target_id in(select id from public.photos where place_id=any(demos));
  delete from public.photos where place_id=any(demos);
  delete from public.moderation_items where target_type='places' and target_id=any(demos);
  delete from public.places where id=any(demos) and created_by=owner_id;
end $$;
select count(*) as remaining_demo_places from public.places where id in('cbdc7dd0-6080-4c2b-a0f4-00f412db2ed3','d218cd3a-ef67-4d04-8a02-7406b53fbb8f');
commit;
