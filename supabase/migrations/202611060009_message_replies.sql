alter table public.place_messages add column reply_to uuid,add column client_request_id uuid not null default gen_random_uuid();
alter table public.place_messages add constraint message_place_identity unique(id,place_id),add constraint message_request unique(author_id,client_request_id),add constraint message_reply_same_place foreign key(reply_to,place_id) references public.place_messages(id,place_id) on delete set null(reply_to);
grant insert(reply_to,client_request_id) on public.place_messages to authenticated;
create function public.check_message_reply() returns trigger language plpgsql set search_path='' as $$begin
 if new.reply_to is not null and not exists(select 1 from public.place_messages m where m.id=new.reply_to and m.place_id=new.place_id and m.moderation_state='approved') then raise exception 'A mensagem original não está disponível nesta sala';end if;
 return new;
end$$;
revoke all on function public.check_message_reply() from public,anon,authenticated;
create trigger reply_guard before insert on public.place_messages for each row execute function public.check_message_reply();
create function public.submit_message(place uuid,body text,reply uuid,request uuid) returns uuid language plpgsql set search_path='' as $$
declare existing public.place_messages;result uuid;
begin
 if auth.uid() is null or request is null then raise exception 'Authentication and request required';end if;
 begin
 insert into public.place_messages(place_id,author_id,body,reply_to,client_request_id) values(place,auth.uid(),trim(body),reply,request) returning id into result;
 return result;
 exception when unique_violation then
 select * into existing from public.place_messages m where m.author_id=auth.uid() and m.client_request_id=request;
 if not found or existing.place_id<>place or existing.body<>trim(body) or existing.reply_to is distinct from reply then raise exception 'Identificador de envio já utilizado em outra mensagem';end if;
 return existing.id;
 end;
end$$;
revoke all on function public.submit_message(uuid,text,uuid,uuid) from public,anon;
grant execute on function public.submit_message(uuid,text,uuid,uuid) to authenticated;
