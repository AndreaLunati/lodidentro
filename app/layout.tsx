import type { Metadata, Viewport } from 'next';
import { ClerkProvider } from '@clerk/nextjs';
import './globals.css';
import './clerk-responsive.css';

export const metadata: Metadata = {
  title: {
    default: 'Lodidentro',
    template: '%s · Lodidentro',
  },
  description: 'Scopri persone, attività ed eventi a Lodi e provincia.',
  applicationName: 'Lodidentro',
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    title: 'Lodidentro',
    statusBarStyle: 'default',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#E63946',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <ClerkProvider>
      <html lang="it">
        <head>
          <link rel="preconnect" href="https://cdnjs.cloudflare.com" />
          <link
            rel="stylesheet"
            href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css"
          />
        </head>
        <body>{children}</body>
      </html>
    </ClerkProvider>
  );
}
