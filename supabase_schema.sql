-- Activer le storage pour les photos
-- À exécuter dans Supabase SQL Editor

-- Table des profils (liée à auth.users)
create table public.profiles (
  id uuid references auth.users on delete cascade primary key,
  username text unique not null,
  avatar_url text,
  ville text,
  total_perso integer default 0,
  dernier_numero_global integer default 0,
  derniere_activite timestamptz,
  date_arrivee timestamptz default now(),
  created_at timestamptz default now()
);

-- Table des pintes
create table public.pintes (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  numero_global integer not null,
  lieu text,
  photo_url text not null,
  created_at timestamptz default now()
);

-- RLS (Row Level Security)
alter table public.profiles enable row level security;
alter table public.pintes enable row level security;

-- Policies profiles
create policy "Profils visibles par tous" on public.profiles
  for select using (true);

create policy "Utilisateur modifie son propre profil" on public.profiles
  for update using (auth.uid() = id);

create policy "Création profil à l'inscription" on public.profiles
  for insert with check (auth.uid() = id);

-- Policies pintes
create policy "Pintes visibles par tous" on public.pintes
  for select using (true);

create policy "Utilisateur poste ses pintes" on public.pintes
  for insert with check (auth.uid() = user_id);

-- Trigger: créer profil automatiquement à l'inscription
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username)
  values (new.id, new.raw_user_meta_data->>'username');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Trigger: mettre à jour le compteur après chaque pinte
create or replace function public.update_user_count()
returns trigger as $$
begin
  update public.profiles
  set
    total_perso = total_perso + 1,
    dernier_numero_global = new.numero_global,
    derniere_activite = new.created_at
  where id = new.user_id;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_pinte_inserted
  after insert on public.pintes
  for each row execute procedure public.update_user_count();

-- Fonction : prochain numéro global (auto-incrémenté serveur)
create or replace function public.next_numero_global()
returns integer as $$
  select coalesce(max(numero_global), 0) + 1 from public.pintes;
$$ language sql security definer;

-- Vue classement des villes
create or replace view public.classement_villes as
select
  ville,
  count(*) as nb_membres,
  sum(total_perso) as total_pintes,
  max(derniere_activite) as derniere_activite
from public.profiles
where ville is not null and ville != ''
group by ville
order by total_pintes desc;

-- Storage bucket pour les photos
insert into storage.buckets (id, name, public)
values ('pintes', 'pintes', true);

create policy "Photos visibles par tous" on storage.objects
  for select using (bucket_id = 'pintes');

create policy "Utilisateur upload ses photos" on storage.objects
  for insert with check (
    bucket_id = 'pintes' and
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- ═══════════════════════════════
-- Réactions & Commentaires
-- ═══════════════════════════════

-- Réactions emoji sur les pintes
create table public.reactions (
  id uuid default gen_random_uuid() primary key,
  pinte_id uuid references public.pintes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  emoji text not null,
  created_at timestamptz default now(),
  unique(pinte_id, user_id, emoji)
);

-- Commentaires sur les pintes
create table public.commentaires (
  id uuid default gen_random_uuid() primary key,
  pinte_id uuid references public.pintes(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  texte text not null check(char_length(texte) <= 200),
  nb_likes integer default 0,
  created_at timestamptz default now()
);

-- Likes sur les commentaires
create table public.commentaire_likes (
  id uuid default gen_random_uuid() primary key,
  commentaire_id uuid references public.commentaires(id) on delete cascade not null,
  user_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now(),
  unique(commentaire_id, user_id)
);

-- RLS
alter table public.reactions enable row level security;
alter table public.commentaires enable row level security;
alter table public.commentaire_likes enable row level security;

create policy "Reactions visibles par tous" on public.reactions for select using (true);
create policy "Utilisateur gère ses reactions" on public.reactions for insert with check (auth.uid() = user_id);
create policy "Utilisateur supprime ses reactions" on public.reactions for delete using (auth.uid() = user_id);

create policy "Commentaires visibles par tous" on public.commentaires for select using (true);
create policy "Utilisateur commente" on public.commentaires for insert with check (auth.uid() = user_id);
create policy "Utilisateur supprime son commentaire" on public.commentaires for delete using (auth.uid() = user_id);

create policy "Likes visibles par tous" on public.commentaire_likes for select using (true);
create policy "Utilisateur like" on public.commentaire_likes for insert with check (auth.uid() = user_id);
create policy "Utilisateur unlike" on public.commentaire_likes for delete using (auth.uid() = user_id);

-- Trigger: mettre à jour nb_likes sur commentaires
create or replace function public.update_commentaire_likes()
returns trigger as $$
begin
  if TG_OP = 'INSERT' then
    update public.commentaires set nb_likes = nb_likes + 1 where id = NEW.commentaire_id;
  elsif TG_OP = 'DELETE' then
    update public.commentaires set nb_likes = nb_likes - 1 where id = OLD.commentaire_id;
  end if;
  return null;
end;
$$ language plpgsql security definer;

create trigger on_commentaire_like
  after insert or delete on public.commentaire_likes
  for each row execute procedure public.update_commentaire_likes();

-- Vue: reactions groupées par pinte (emoji + count)
create or replace view public.reactions_summary as
select
  pinte_id,
  emoji,
  count(*) as nb,
  array_agg(user_id) as user_ids
from public.reactions
group by pinte_id, emoji;

-- ═══════════════════════════════
-- Chat, Badges, GPS
-- ═══════════════════════════════

-- Messages chat
create table public.messages_chat (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  texte text not null check(char_length(texte) <= 500),
  created_at timestamptz default now()
);
alter table public.messages_chat enable row level security;
create policy "Messages visibles par tous" on public.messages_chat for select using (true);
create policy "Utilisateur envoie message" on public.messages_chat for insert with check (auth.uid() = user_id);

-- Badges débloqués
create table public.badges_utilisateur (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  badge_id text not null,
  unlocked_at timestamptz default now(),
  unique(user_id, badge_id)
);
alter table public.badges_utilisateur enable row level security;
create policy "Badges visibles par tous" on public.badges_utilisateur for select using (true);
create policy "Système insère badges" on public.badges_utilisateur for insert with check (true);

-- GPS sur les pintes
alter table public.pintes add column if not exists latitude float;
alter table public.pintes add column if not exists longitude float;
