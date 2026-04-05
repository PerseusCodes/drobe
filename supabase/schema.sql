-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Garments table
create table garments (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  category text not null,
  color text not null,
  color_name text not null,
  season text[] not null default '{}',
  occasions text[] not null default '{}',
  image_path text,
  label_image_path text,
  fabrics text[] default '{}',
  brand text,
  date_added timestamptz not null default now(),
  times_worn integer not null default 0,
  last_worn timestamptz,
  favorite boolean not null default false,
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Outfits table
create table outfits (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  occasion text not null,
  season text not null,
  created_at timestamptz not null default now(),
  times_worn integer not null default 0,
  saved boolean not null default true,
  is_public boolean not null default false
);

-- Outfit items (junction)
create table outfit_items (
  outfit_id uuid references outfits(id) on delete cascade,
  garment_id uuid references garments(id) on delete cascade,
  primary key (outfit_id, garment_id)
);

-- Row Level Security
alter table garments enable row level security;
alter table outfits enable row level security;
alter table outfit_items enable row level security;

-- RLS policies: users can only access their own data
create policy "Users own their garments"
  on garments for all
  using (auth.uid() = user_id);

create policy "Users own their outfits"
  on outfits for all
  using (auth.uid() = user_id);

create policy "Users own their outfit items"
  on outfit_items for all
  using (
    exists (
      select 1 from outfits
      where outfits.id = outfit_items.outfit_id
      and outfits.user_id = auth.uid()
    )
  );

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger garments_updated_at
  before update on garments
  for each row execute function update_updated_at();

-- Storage bucket (run this in Supabase dashboard Storage section)
-- Bucket name: garment-images
-- Public: false (private, signed URLs)
