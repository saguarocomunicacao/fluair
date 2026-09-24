revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.has_role(uuid, app_role) from public, anon;
revoke execute on function public.can_edit_content(uuid) from public, anon;
revoke execute on function public.can_sales(uuid) from public, anon;
grant execute on function public.has_role(uuid, app_role) to authenticated;
grant execute on function public.can_edit_content(uuid) to authenticated;
grant execute on function public.can_sales(uuid) to authenticated;