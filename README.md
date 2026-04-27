# 🍺 50 Nuances de Pinte

Web app pour tracker les pintes du groupe. Stack : React + Supabase + Vercel.

## Setup en 4 étapes

### 1. Supabase

1. Crée un compte sur [supabase.com](https://supabase.com) (gratuit)
2. Crée un nouveau projet
3. Va dans **SQL Editor** et colle tout le contenu de `supabase_schema.sql`
4. Exécute le script → ça crée les tables, les règles de sécurité et le storage

Récupère tes clés dans **Settings → API** :
- `Project URL` → `VITE_SUPABASE_URL`
- `anon public` → `VITE_SUPABASE_ANON_KEY`

### 2. Variables d'environnement

Copie `.env.example` en `.env` et remplis tes clés :
```
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJxxx...
```

### 3. Lancer en local

```bash
npm install
npm run dev
```

### 4. Déployer sur Vercel

1. Push le projet sur GitHub
2. Connecte le repo sur [vercel.com](https://vercel.com)
3. Dans les settings du projet Vercel, ajoute les variables d'environnement
4. Deploy → t'as une URL publique !

## Importer les membres existants

Un CSV `pintes_final.csv` avec les 289 membres connus est fourni.
Pour l'importer, utilise le script suivant dans Supabase SQL Editor
en remplaçant les données par celles du CSV.

Ou plus simplement : les nouveaux membres se créent automatiquement
quand ils s'inscrivent sur l'app.

## Structure de la DB

```
profiles
  id          uuid (lié à auth.users)
  username    text
  total_perso integer  ← nombre de pintes postées
  dernier_numero_global integer ← dernier n° global posté
  derniere_activite timestamptz
  date_arrivee timestamptz

pintes
  id          uuid
  user_id     uuid → profiles
  numero_global integer
  lieu        text
  photo_url   text
  created_at  timestamptz
```

## Features

- 🔐 Auth email/mot de passe
- 📸 Post de pinte avec photo (stockée dans Supabase Storage)
- 🏆 Classement en temps réel
- 📱 PWA installable sur mobile
- 🔔 Feed live (realtime Supabase)
