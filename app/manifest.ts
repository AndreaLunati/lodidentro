import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Lodidentro',
    short_name: 'Lodidentro',
    description: 'Eventi, gruppi e attività a Lodi e provincia.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0f172a',
    theme_color: '#E63946',
    orientation: 'portrait',
  };
}
