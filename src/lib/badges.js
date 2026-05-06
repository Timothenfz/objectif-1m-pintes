export const BADGES = [
  // CLASSIQUE
  { id: 'first_sip',     cat: 'Classique', rarity: 'Commun',      icon: '🍺', name_fr: 'Première Gorgée',  name_en: 'First Sip',        desc_fr: 'Poster 1 pinte',              desc_en: 'Post 1 pint',               check: (s) => s.total_perso >= 1 },
  { id: 'regular',       cat: 'Classique', rarity: 'Commun',      icon: '🍻', name_fr: 'Habitué',           name_en: 'Regular',           desc_fr: '10 pintes',                   desc_en: '10 pints',                  check: (s) => s.total_perso >= 10 },
  { id: 'pillar',        cat: 'Classique', rarity: 'Peu commun',  icon: '🏛',  name_fr: 'Pilier de Bar',     name_en: 'Bar Pillar',        desc_fr: '50 pintes',                   desc_en: '50 pints',                  check: (s) => s.total_perso >= 50 },
  { id: 'legend',        cat: 'Classique', rarity: 'Rare',        icon: '👑', name_fr: 'Légende',            name_en: 'Legend',            desc_fr: '100 pintes',                  desc_en: '100 pints',                 check: (s) => s.total_perso >= 100 },
  { id: 'demigod',       cat: 'Classique', rarity: 'Épique',      icon: '⚡', name_fr: 'Demi-Dieu',          name_en: 'Demigod',           desc_fr: '500 pintes',                  desc_en: '500 pints',                 check: (s) => s.total_perso >= 500 },

  // STREAK
  { id: 'on_fire',       cat: 'Streak',    rarity: 'Commun',      icon: '🔥', name_fr: 'En Feu',             name_en: 'On Fire',           desc_fr: '3 jours consécutifs',         desc_en: '3 consecutive days',        check: (s) => s.streak >= 3 },
  { id: 'addicted',      cat: 'Streak',    rarity: 'Peu commun',  icon: '🔥🔥', name_fr: 'Accro',            name_en: 'Addicted',          desc_fr: '7 jours consécutifs',         desc_en: '7 consecutive days',        check: (s) => s.streak >= 7 },
  { id: 'unstoppable',   cat: 'Streak',    rarity: 'Épique',      icon: '🔥🔥🔥', name_fr: 'Inarrêtable',  name_en: 'Unstoppable',       desc_fr: '30 jours consécutifs',        desc_en: '30 consecutive days',       check: (s) => s.streak >= 30 },

  // HEURE
  { id: 'early_bird',    cat: 'Heure',     rarity: 'Peu commun',  icon: '🌅', name_fr: 'Lève-tôt',           name_en: 'Early Bird',        desc_fr: 'Poster avant 10h',            desc_en: 'Post before 10am',          check: (s) => s.hasEarlyPost },
  { id: 'nightowl',      cat: 'Heure',     rarity: 'Rare',        icon: '🦉', name_fr: 'Noctambule',         name_en: 'Night Owl',         desc_fr: 'Poster après minuit',         desc_en: 'Post after midnight',       check: (s) => s.hasNightPost },
  { id: 'happy_hour',    cat: 'Heure',     rarity: 'Commun',      icon: '⏰', name_fr: 'Happy Hour',          name_en: 'Happy Hour',        desc_fr: 'Poster entre 17h et 19h',     desc_en: 'Post between 5pm and 7pm', check: (s) => s.hasHappyHour },
  { id: 'apero',         cat: 'Heure',     rarity: 'Commun',      icon: '🧀', name_fr: 'Apéro Roi',           name_en: 'Apéro King',        desc_fr: 'Poster entre 12h et 14h',     desc_en: 'Post between noon and 2pm', check: (s) => s.hasApero },

  // LIEUX
  { id: 'globetrotter',  cat: 'Lieux',     rarity: 'Rare',        icon: '✈️', name_fr: 'Globe Trotter',      name_en: 'Globe Trotter',     desc_fr: '5 villes différentes',        desc_en: '5 different cities',        check: (s) => s.nbVilles >= 5 },
  { id: 'explorer',      cat: 'Lieux',     rarity: 'Épique',      icon: '🗺', name_fr: 'Explorateur',         name_en: 'Explorer',          desc_fr: '10 villes différentes',       desc_en: '10 different cities',       check: (s) => s.nbVilles >= 10 },
  { id: 'local',         cat: 'Lieux',     rarity: 'Peu commun',  icon: '📍', name_fr: 'Pilier Local',        name_en: 'Local Legend',      desc_fr: '10 pintes au même endroit',   desc_en: '10 pints at the same spot', check: (s) => s.maxSameLieu >= 10 },

  // SOIRÉE
  { id: 'friday',        cat: 'Soirée',    rarity: 'Commun',      icon: '🎉', name_fr: 'Vendredi Soir',      name_en: 'Friday Night',      desc_fr: 'Poster un vendredi soir',     desc_en: 'Post on a Friday night',    check: (s) => s.hasFriday },
  { id: 'weekend',       cat: 'Soirée',    rarity: 'Peu commun',  icon: '📅', name_fr: 'Weekend Warrior',    name_en: 'Weekend Warrior',   desc_fr: '10 pintes le weekend',        desc_en: '10 pints on weekends',      check: (s) => s.weekendPintes >= 10 },
  { id: 'instigator',    cat: 'Soirée',    rarity: 'Rare',        icon: '🫵', name_fr: 'Instigateur',         name_en: 'Instigator',        desc_fr: 'Premier à poster dans la journée', desc_en: 'First to post of the day', check: (s) => s.firstOfDay >= 5 },

  // FUN
  { id: 'can_pride',     cat: 'Fun',       rarity: 'Commun',      icon: '🥫', name_fr: 'Canette Pride',      name_en: 'Can Pride',         desc_fr: '3 pintes en canette',         desc_en: '3 canned pints',            check: (s) => s.canettes >= 3 },
  { id: 'homebrew',      cat: 'Fun',       rarity: 'Peu commun',  icon: '🏠', name_fr: 'Maison Brewing',     name_en: 'Home Brewing',      desc_fr: '5 pintes maison',             desc_en: '5 home pints',              check: (s) => s.pinteMaison >= 5 },
  { id: 'ambassador',    cat: 'Fun',       rarity: 'Rare',        icon: '🤝', name_fr: 'Ambassadeur',        name_en: 'Ambassador',        desc_fr: 'Parrainer 3 membres',         desc_en: 'Refer 3 members',           check: (s) => s.referrals >= 3 },
  { id: 'photographer',  cat: 'Fun',       rarity: 'Commun',      icon: '📸', name_fr: 'Photographe',        name_en: 'Photographer',      desc_fr: '20 pintes postées',           desc_en: '20 pints posted',           check: (s) => s.total_perso >= 20 },

  // RARE
  { id: 'el_presidente', cat: 'Rare',      rarity: 'Épique',      icon: '🏆', name_fr: 'El Presidente',      name_en: 'El Presidente',     desc_fr: 'Être 1er du classement',      desc_en: 'Be #1 in the ranking',      check: (s) => s.isFirst },
  { id: 'white_night',   cat: 'Rare',      rarity: 'Rare',        icon: '💀', name_fr: 'Nuit Blanche',       name_en: 'White Night',       desc_fr: 'Pinte entre 3h et 5h du matin', desc_en: 'Pint between 3am and 5am', check: (s) => s.hasWhiteNight },
  { id: 'golden_pint',   cat: 'Rare',      rarity: 'Épique',      icon: '✨', name_fr: 'Pinte Dorée',        name_en: 'Golden Pint',       desc_fr: 'Poster la pinte n°1000 ou n°10000', desc_en: 'Post pint #1000 or #10000', check: (s) => s.hasGoldenPint },
  { id: 'social_king',   cat: 'Rare',      rarity: 'Rare',        icon: '💬', name_fr: 'Roi du Chat',        name_en: 'Chat King',         desc_fr: '50 messages dans le chat',    desc_en: '50 chat messages',          check: (s) => s.chatMessages >= 50 },
  { id: 'reactor',       cat: 'Fun',       rarity: 'Commun',      icon: '😂', name_fr: 'Réacteur',           name_en: 'Reactor',           desc_fr: '30 réactions postées',        desc_en: '30 reactions posted',       check: (s) => s.reactions >= 30 },
  { id: 'commentator',   cat: 'Fun',       rarity: 'Peu commun',  icon: '🗣', name_fr: 'Commentateur',       name_en: 'Commentator',       desc_fr: '20 commentaires postés',      desc_en: '20 comments posted',        check: (s) => s.commentaires >= 20 },
  { id: 'globe_brassicole', cat: 'Rare',    rarity: 'Légendaire',  icon: '🌍', name_fr: 'Globe Trotter Brassicole', name_en: 'Beer Globe Trotter', desc_fr: 'Poster une pinte sur 5 continents', desc_en: 'Post a pint on 5 continents', check: (s) => s.continents >= 5 },
]

export const CATEGORIES = ['Tous', 'Classique', 'Streak', 'Heure', 'Lieux', 'Soirée', 'Fun', 'Rare']

export const RARITY_COLORS = {
  'Commun':     { bg: 'rgba(255,255,255,0.05)', border: 'rgba(255,255,255,0.1)',  text: '#7a7670' },
  'Peu commun': { bg: 'rgba(100,200,100,0.08)', border: 'rgba(100,200,100,0.2)', text: '#4ade80' },
  'Rare':       { bg: 'rgba(100,150,255,0.08)', border: 'rgba(100,150,255,0.2)', text: '#818cf8' },
  'Épique':     { bg: 'rgba(245,166,35,0.08)',  border: 'rgba(245,166,35,0.25)', text: '#f5a623' },
  'Légendaire': { bg: 'rgba(255,215,0,0.12)',    border: 'rgba(255,215,0,0.4)',    text: '#FFD700' },
}
