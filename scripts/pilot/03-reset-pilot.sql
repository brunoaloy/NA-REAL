-- Limpeza do piloto solicitada pelo proprietário em 09/11/2026.
-- ALVO: NA REAL (zcnfssihiqmbrlwvlsme), SQL Editor.
-- Preserve Auth, senha, confirmação, perfil básico e papel de moderador.
-- Primeiro remova os arquivos dos buckets community-photos e reviewed-photos
-- pelo Dashboard Storage/API. NÃO apague storage.objects por SQL.
-- Feche apps e painel. Crie a segunda conta somente DEPOIS da limpeza.
-- Inventário congelado: conteúdo novo ou alterado interrompe a transação.
begin;
set local lock_timeout = '5s';
set local timezone = 'UTC';
lock table auth.users in share mode;
lock table storage.objects in share mode;
lock table public.safe_admins in share mode;
lock table public.profiles, public.places, public.photos, public.reviews, public.favorites, public.place_questions, public.question_answers, public.notifications, public.content_reports, public.safe_accounts, public.user_blocks, public.live_reports, public.report_confirmations, public.place_follows, public.notification_preferences, public.moderation_items, public.moderation_actions, public.moderation_appeals, public.ugc_reports, public.safe_write_events, public.account_appeals, public.place_change_suggestions, public.place_messages in access exclusive mode;
do $$
declare
 owner_id uuid := 'c8c2eedf-675d-47fc-89c0-e02b8645bac5';
 expected jsonb := '{"profiles":"4709ba4921626820593b2de2185306e4","places":"8d50f4abb8defd4eea370d661d143f8d","photos":"50616d482d094a803aecc3e17647c9ae","reviews":"d41d8cd98f00b204e9800998ecf8427e","favorites":"d41d8cd98f00b204e9800998ecf8427e","place_questions":"d41d8cd98f00b204e9800998ecf8427e","question_answers":"d41d8cd98f00b204e9800998ecf8427e","notifications":"d41d8cd98f00b204e9800998ecf8427e","content_reports":"d41d8cd98f00b204e9800998ecf8427e","safe_accounts":"d41d8cd98f00b204e9800998ecf8427e","user_blocks":"d41d8cd98f00b204e9800998ecf8427e","live_reports":"d41d8cd98f00b204e9800998ecf8427e","report_confirmations":"d41d8cd98f00b204e9800998ecf8427e","place_follows":"d41d8cd98f00b204e9800998ecf8427e","notification_preferences":"5a0ca96296d39feca8ea107b21b333e7","moderation_items":"48e97de34e265d4b533e3ded0ffd906a","moderation_actions":"16c575d5fb346b69a77f04526acac494","moderation_appeals":"d41d8cd98f00b204e9800998ecf8427e","ugc_reports":"d41d8cd98f00b204e9800998ecf8427e","safe_write_events":"2da83b6fe0739e08a8a03a00806a091b","account_appeals":"d41d8cd98f00b204e9800998ecf8427e","place_change_suggestions":"d41d8cd98f00b204e9800998ecf8427e","place_messages":"d41d8cd98f00b204e9800998ecf8427e"}'::jsonb;
 entry record;
 current_hash text;
begin
 if (select count(*) from auth.users) <> 1 or not exists(select 1 from auth.users where id=owner_id and email_confirmed_at is not null) then
  raise exception 'Contas mudaram; nada apagado. Limpe antes de cadastrar o segundo iPhone';
 end if;
 if not exists(select 1 from public.safe_admins where user_id=owner_id) then raise exception 'Moderador não encontrado'; end if;
 if exists(select 1 from pg_catalog.pg_tables where schemaname='public' and tablename <> 'safe_admins' and not expected ? tablename) then
  raise exception 'O schema mudou; revise o plano antes de limpar';
 end if;
 if exists(select 1 from storage.objects where bucket_id in ('community-photos','reviewed-photos')) then
  raise exception 'Remova primeiro os arquivos pelo Storage; nenhuma linha da aplicação foi apagada';
 end if;
 for entry in select key, value from jsonb_each_text(expected) loop
  execute format($q$select md5(coalesce(string_agg(to_jsonb(t)::text,E'\n' order by to_jsonb(t)::text),'')) from public.%I t$q$,entry.key) into current_hash;
  if current_hash is distinct from entry.value then raise exception 'Inventário mudou em %. Nada apagado; atualize o plano',entry.key; end if;
 end loop;
 update public.profiles set display_name='Explorador',handle=null,bio='',moderation_state='pending' where id=owner_id;
 delete from public.report_confirmations;
 delete from public.favorites;
 delete from public.place_follows;
 delete from public.notifications;
 delete from public.content_reports;
 delete from public.ugc_reports;
 delete from public.place_change_suggestions;
 delete from public.question_answers;
 delete from public.place_questions;
 delete from public.place_messages;
 delete from public.live_reports;
 delete from public.photos;
 delete from public.reviews;
 delete from public.places;
 delete from public.moderation_appeals;
 delete from public.moderation_actions;
 delete from public.moderation_items;
 delete from public.user_blocks;
 delete from public.notification_preferences;
 delete from public.account_appeals;
 delete from public.safe_accounts;
 delete from public.safe_write_events;
 -- Removida também a fila/evento gerados pelo update do perfil genérico.
 for entry in select key from jsonb_each_text(expected) where key <> 'profiles' loop
  execute format('select count(*)::text from public.%I',entry.key) into current_hash;
  if current_hash <> '0' then raise exception 'Limpeza incompleta em %; rollback automático',entry.key; end if;
 end loop;
 if not exists(select 1 from public.profiles where id=owner_id and display_name='Explorador' and handle is null and bio='') then raise exception 'Perfil básico não preservado'; end if;
 if not exists(select 1 from public.safe_admins where user_id=owner_id) then raise exception 'Moderador não preservado'; end if;
end $$;
select (select count(*) from auth.users) as contas_preservadas,
 (select count(*) from public.places) as lugares,
 (select count(*) from public.photos) as fotos,
 (select count(*) from public.moderation_items) as fila,
 exists(select 1 from public.safe_admins where user_id='c8c2eedf-675d-47fc-89c0-e02b8645bac5') as moderador_preservado;
commit;
