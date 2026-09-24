-- Permite que o staff leia objetos e gere URLs assinadas (tokens de 10 anos servem o site público)
create policy "staff select fluair"
on storage.objects
for select
to authenticated
using (bucket_id = any (array['produtos','banners','noticias','downloads']) and private.can_edit_content(auth.uid()));