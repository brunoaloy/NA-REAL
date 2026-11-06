\set ON_ERROR_STOP on
reset role;
-- Fixtures only in disposable DB. Same display name in another city is allowed.
insert into public.places(id,name,category,city,state,address,geom,verification_status,is_public_venue)
values('11000000-0000-0000-0000-000000000001','Teste proximidade','Comer','Recife','PE','Rua Pública 100','SRID=4326;POINT(-34.88 -8.05)','approved',true),
('11000000-0000-0000-0000-000000000002','Teste proximidade','Comer','Olinda','PE','Rua Pública 200','SRID=4326;POINT(-34.85 -8.01)','approved',true);
update public.places set moderation_state='approved' where id in ('11000000-0000-0000-0000-000000000001','11000000-0000-0000-0000-000000000002');
set role anon;
set request.jwt.claim.sub='';
do $$begin
 if (select id from public.search_places_near(-8.01,-34.85,'Teste proximidade') limit 1)<>'11000000-0000-0000-0000-000000000002'::uuid then raise exception 'Not ordered by distance';end if;
 if (select count(*) from public.search_places_near(-8.01,-34.85,'Teste proximidade','Todos','Recife','PE'))<>1 then raise exception 'Proximity ignored city filter';end if;
 if exists(select 1 from public.search_places_near(-8.01,-34.85,'Teste proximidade','Lazer')) then raise exception 'Proximity ignored category';end if;
 if exists(select 1 from public.search_places_near(-8.01,-34.85,'Teste proximidade','Todos','','',1)) then raise exception 'Page repeated';end if;
 begin perform public.search_places_near(91,0);raise exception 'Invalid coordinates accepted';exception when raise_exception then if sqlerrm='Invalid coordinates accepted' then raise;end if;end;
 if exists(select 1 from public.search_places_near(-8.01,-34.85) where name='Local pendente') then raise exception 'Pending venue leaked';end if;
end$$;
reset role;
-- Equal timestamps must neither skip nor repeat reviews at the cursor boundary.
insert into auth.users(id) select ('90000000-0000-0000-0000-'||lpad(n::text,12,'0'))::uuid from generate_series(1,35) n;
insert into public.reviews(place_id,author_id,rating,body,created_at)
select '11000000-0000-0000-0000-000000000001',id,4,'Fixture de paginação', '2026-01-01T00:00:00Z' from auth.users where id::text like '90000000-%';
update public.reviews set status='approved',moderation_state='approved' where place_id='11000000-0000-0000-0000-000000000001';
set role anon;
do $$declare boundary public.reviews; remaining integer;begin
 select * into boundary from public.reviews where place_id='11000000-0000-0000-0000-000000000001' order by created_at desc,id desc offset 29 limit 1;
 select count(*) into remaining from public.reviews where place_id='11000000-0000-0000-0000-000000000001' and (created_at<boundary.created_at or(created_at=boundary.created_at and id<boundary.id));
 if remaining<>5 then raise exception 'Review cursor lost tied rows';end if;
 if (select review_count from public.place_ratings where place_id='11000000-0000-0000-0000-000000000001')<>35 then raise exception 'Incorrect rating count';end if;
end$$;
reset role;
select 'Sprint 01 proximity, review cursor and RLS assertions passed' as result;
