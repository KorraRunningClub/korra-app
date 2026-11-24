-- Comprovante (foto/print ou PDF) anexado a cada despesa. Arquivos privados, só o treinador acessa.
alter table public.despesas add column if not exists comprovante text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('comprovantes', 'comprovantes', false, 10485760,
        array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'])
on conflict (id) do update set file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "comprovantes: treinador envia" on storage.objects;
create policy "comprovantes: treinador envia" on storage.objects for insert to authenticated
  with check (bucket_id = 'comprovantes' and public.eh_treinador());
drop policy if exists "comprovantes: treinador vê" on storage.objects;
create policy "comprovantes: treinador vê" on storage.objects for select to authenticated
  using (bucket_id = 'comprovantes' and public.eh_treinador());
drop policy if exists "comprovantes: treinador apaga" on storage.objects;
create policy "comprovantes: treinador apaga" on storage.objects for delete to authenticated
  using (bucket_id = 'comprovantes' and public.eh_treinador());
