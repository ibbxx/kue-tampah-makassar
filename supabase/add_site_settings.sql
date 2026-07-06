create table if not exists public.site_settings (
  id text primary key default 'global',
  about_image_url text,
  updated_at timestamptz default now(),
  constraint site_settings_singleton check (id = 'global')
);

alter table public.site_settings enable row level security;

drop policy if exists "site_settings_public_read" on public.site_settings;
create policy "site_settings_public_read" on public.site_settings for select using (true);

drop policy if exists "site_settings_admin_all" on public.site_settings;
create policy "site_settings_admin_all" on public.site_settings for all
  using (private.has_role(auth.uid(), 'admin'))
  with check (private.has_role(auth.uid(), 'admin'));

insert into public.site_settings (id, about_image_url) values ('global', 'https://images.unsplash.com/photo-1571115764595-644a1f56a55c?w=1200&q=80') on conflict (id) do nothing;
