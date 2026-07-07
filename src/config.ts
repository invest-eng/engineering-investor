export const SITE = {
  name: 'Engineering Investor',
  tagline: 'Razlaga trgov skozi aktualne dogodke.',
  description:
    'Finančno-izobraževalna vsebina za slovensko občinstvo. Filtriramo informacije, razlagamo trge in geopolitiko. Brez hypea, brez finančnih nasvetov.',
  url: 'https://engineeringinvestor.si',
  twitterHandle: '@JazJst',
  twitterUrl: 'https://x.com/JazJst',
};

export const NAV_LINKS = [
  { label: 'Analize', href: '/analize' },
  { label: 'Dnevni pregled', href: '/dnevni-pregled' },
  { label: 'Koledar', href: '/koledar' },
  { label: 'Kalkulatorji', href: '/kalkulatorji' },
  { label: 'Sledilnik', href: '/sledilnik' },
  { label: 'Davčni tracker', href: '/davek' },
  { label: 'Premium', href: '/premium' },
  { label: 'O meni', href: '/o-meni' },
];

export const CATEGORIES = [
  'Makro',
  'Geopolitika',
  'Trgi',
  'Bitcoin',
  'Delnice',
] as const;

export type Category = (typeof CATEGORIES)[number];
