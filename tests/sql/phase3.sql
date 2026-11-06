\set ON_ERROR_STOP on
reset role;
-- Existing A is suspended; use B as contributor and protected moderator C.
delete from public.user_blocks;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
insert into public.place_change_suggestions(place_id,author_id,expected_revision,field,proposed_value,reason) select id,auth.uid(),content_revision,'address','Rua Pública corrigida 20','Endereço público estava desatualizado' from public.places where name='Local aprovado';
do $$begin
 begin perform public.review_place_suggestion((select id from public.place_change_suggestions limit 1),true,'Fake admin');raise exception 'Nonadmin approved';exception when insufficient_privilege then null;end;
 begin update public.place_change_suggestions set status='approved';raise exception 'Client approved';exception when insufficient_privilege then null;end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000003';
select public.review_place_suggestion(id,true,'Revisão humana do endereço público') from public.place_change_suggestions;
reset role;
do $$begin
 if not exists(select 1 from public.places where address='Rua Pública corrigida 20' and moderation_state='approved') then raise exception 'Correction not applied';end if;
 if not exists(select 1 from public.moderation_actions where decision='correction_approved') then raise exception 'Missing audit';end if;
end$$;
set role anon;
set request.jwt.claim.sub='';
do $$begin begin perform count(*) from public.place_change_suggestions;raise exception 'Private corrections leaked';exception when insufficient_privilege then null;end;end$$;
reset role;
select 'Phase 3 corrections assertions passed' as result;
