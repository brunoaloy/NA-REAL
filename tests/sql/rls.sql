\set ON_ERROR_STOP on
insert into auth.users values ('00000000-0000-0000-0000-000000000001'),('00000000-0000-0000-0000-000000000002');
insert into public.places(id,name,category,city,state,address,verification_status,is_public_venue) values ('10000000-0000-0000-0000-000000000001','Local aprovado','Comer','Recife','PE','Rua Pública 10','approved',true),('10000000-0000-0000-0000-000000000002','Local pendente','Comer','Recife','PE','Rua Pública 11','pending',true);
update public.places set moderation_state='approved' where verification_status='approved';
set role anon;
set request.jwt.claim.sub='';
do $$begin if (select count(*) from public.places)<>1 then raise exception 'Anon sees pending place'; end if; end$$;
reset role;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.reviews(place_id,author_id,rating,body) values('10000000-0000-0000-0000-000000000001',auth.uid(),5,'Muito bom');
insert into public.place_messages(place_id,author_id,body) values('10000000-0000-0000-0000-000000000001',auth.uid(),'Olá comunidade');
do $$begin
 begin
 insert into public.place_messages(place_id,author_id,body) values('10000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002','Impersonation');
 raise exception 'Impersonation allowed';
 exception when insufficient_privilege then null; end;
 begin
 update public.places set verification_status='approved';
 raise exception 'Self approval allowed';
 exception when insufficient_privilege then null; end;
end$$;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$declare n int; begin
 update public.reviews set rating=1; get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-user edit allowed'; end if;
 delete from public.place_messages; get diagnostics n=row_count;
 if n<>0 then raise exception 'Cross-user delete allowed'; end if;
 begin update public.reviews set author_id=auth.uid();raise exception 'Author mutation allowed';exception when insufficient_privilege then null;end;
 if (select count(*) from public.notifications)<>0 then raise exception 'Notification leak';end if;
end$$;
reset role;
select 'RLS assertions passed' as result;
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
insert into public.place_questions(place_id,author_id,kind,body) values('10000000-0000-0000-0000-000000000001',auth.uid(),'movement','Está cheio?');
reset role;
update public.place_questions set moderation_state='approved';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
insert into public.question_answers(question_id,author_id,body) values((select id from public.place_questions limit 1),auth.uid(),'Tranquilo, relato pessoal');
do $$begin if (select count(*) from public.notifications)<>0 then raise exception 'Recipient notification leaked to responder';end if;end$$;
reset role;
update public.question_answers set moderation_state='approved';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
do $$begin if (select count(*) from public.notifications)<>1 then raise exception 'Answer notification missing';end if;end$$;
reset role;
update public.place_questions set expires_at=now()-interval '1 minute';
set role authenticated;
set request.jwt.claim.sub='00000000-0000-0000-0000-000000000002';
do $$begin
 begin insert into public.question_answers(question_id,author_id,body) values((select id from public.place_questions limit 1),auth.uid(),'Late answer');raise exception 'Expired answer accepted';exception when insufficient_privilege then null;end;
end$$;
reset role;
select 'Community assertions passed' as result;
