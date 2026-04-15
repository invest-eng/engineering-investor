/**
 * Vrne pravilno pot z upoštevanjem Astro base URL.
 * Potrebno za GitHub Pages deployment na podmapi (npr. /engineering-investor/).
 */
export function url(path: string): string {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${base}${clean}`;
}
