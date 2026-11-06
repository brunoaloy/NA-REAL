\set ON_ERROR_STOP on
-- Existing fixtures are A/B. Create a moderator using privileged SQL only.
insert into auth.users values ('00000000-0000-0000-0000-000000000003');
insert into public.safe_admins values ('00000000-0000-0000-0000-000000000003');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.place_messages(place_id,author_id,body) values('10000000-0000-0000-0000-000000000001',auth.uid(),'Pending until real review');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 if exists(select 1 from public.place_messages where body='Pending until real review') then raise exception 'Unreviewed content leaked';end if;
 begin perform public.moderate_content((select id from public.moderation_items limit 1),'approved','Forged decision');raise exception 'Non admin accepted';exception when insufficient_privilege then null;end;
 begin update public.place_messages set moderation_state='approved';raise exception 'Self approval allowed';exception when insufficient_privilege then null;end;
 begin insert into public.safe_admins values(auth.uid());raise exception 'Role escalation';exception when insufficient_privilege then null;end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.moderate_content(id,'approved','Human reviewed test message') from public.moderation_items where payload->>'body'='Pending until real review';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin if not exists(select 1 from public.place_messages where body='Pending until real review') then raise exception 'Approved content missing';end if;end$$;
insert into public.user_blocks(blocker_id,blocked_id) values(auth.uid(),'00000000-0000-0000-0000-000000000001');
do $$begin if exists(select 1 from public.place_messages where body='Pending until real review') then raise exception 'Blocked content leaked';end if;end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.suspend_account('00000000-0000-0000-0000-000000000001',true,'Spam review test');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 begin insert into public.place_messages(place_id,author_id,body) values('10000000-0000-0000-0000-000000000001',auth.uid(),'Suspended write');raise exception 'Suspended user write accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'Safe assertions passed' as result;
-- Stale decisions must not approve an edited version; clients cannot mutate moderation state.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.suspend_account('00000000-0000-0000-0000-000000000001',false,'Reinstate for revision test');
reset role;
insert into public.profiles(id,display_name,handle) values('00000000-0000-0000-0000-000000000001','Original public name','teste_a');
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
update public.profiles set display_name='Edited profile' where id=auth.uid();
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
do $$declare applied boolean;begin
 select public.moderate_content(id,'approved','Stale version test') into applied from public.moderation_items where target_type='profiles' and payload->>'display_name'='Original public name';
 if applied then raise exception 'Stale revision approved';end if;
end$$;
reset role;
do $$begin if (select moderation_state from public.profiles where handle='teste_a')<>'pending' then raise exception 'Edited profile was exposed';end if;end$$;
-- Server duplicate guard serializes matching name/city/UF without exposing pending rows.
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin
 begin
 insert into public.places(name,category,city,state,address,created_by,is_public_venue) values('Local aprovado','Comer','Recife','PE','Rua Pública 10',auth.uid(),true);
 raise exception 'Duplicate was accepted';
 exception when raise_exception then if sqlerrm='Duplicate was accepted' then raise;end if;end;
 begin
 insert into public.places(name,category,city,state,address,created_by,is_public_venue) values('Residência','Comer','Recife','PE','Rua Privada 10',auth.uid(),false);
 raise exception 'Private residence was accepted';
 exception when raise_exception then if sqlerrm='Private residence was accepted' then raise;end if;end;
end$$;
insert into public.photos(owner_id,place_id,object_path,byte_size) values(auth.uid(),'10000000-0000-0000-0000-000000000001',auth.uid()::text||'/30000000-0000-0000-0000-000000000001.jpg',1024);
insert into storage.objects(bucket_id,name) values('community-photos',auth.uid()::text||'/30000000-0000-0000-0000-000000000001.jpg');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin if exists(select 1 from storage.objects) then raise exception 'Unreviewed media exposed';end if;end$$;
reset role;
set role anon;
set request.jwt.claim.sub='';
do $$begin if not exists(select 1 from public.search_places('Local','Todos','Recife','PE',0)) then raise exception 'Search lost approved venue';end if;end$$;
reset role;
select 'Revision, duplicate and Storage assertions passed' as result;
-- Staging is private even when the sanitized derivative is approved.
update public.photos set sanitized_at=now(),moderation_state='approved';
insert into storage.objects(bucket_id,name) select 'reviewed-photos',owner_id::text||'/'||content_revision::text||'.jpg' from public.photos;
set role anon;
set request.jwt.claim.sub='';
do $$begin
 if exists(select 1 from storage.objects where bucket_id='community-photos') then raise exception 'Original staging file became public';end if;
 if not exists(select 1 from storage.objects where bucket_id='reviewed-photos') then raise exception 'Reviewed photo unavailable';end if;
end$$;
reset role;
-- Modern PostgREST JWT claims authorize the service worker without exposing that RPC to users.
set role service_role;
set request.jwt.claim.sub='';
set request.jwt.claims='{"role":"service_role"}';
select public.safe_apply(id,'pending','Provider unavailable test','provider-test','{}') from public.moderation_items where target_type='profiles' and state='pending';
reset role;
select 'Reviewed media and service-worker assertions passed' as result;
-- Suspension appeal doesn't require permission to post public content.
set role authenticated;
set request.jwt.claims='';
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.suspend_account('00000000-0000-0000-0000-000000000001',true,'Appeal test');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.account_appeals(user_id,reason) values(auth.uid(),'Peço revisão humana desta suspensão.');
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin if exists(select 1 from public.account_appeals) then raise exception 'Suspension appeal leaked to other user';end if;end$$;
reset role;
select 'Suspension appeal assertions passed' as result;
