# Lodidentro — versione completa app-size + Clerk

Questa cartella è una patch frontend completa per Next.js App Router. Mantiene la UI in formato app e usa Clerk soltanto quando l'utente deve identificarsi.

## Dimensioni app

- smartphone: larghezza piena e `100dvh`;
- desktop: frame massimo `430px × 900px`;
- altezza desktop massima `92vh`;
- header fisso nel frame;
- area centrale scrollabile;
- bottom navigation sempre visibile;
- supporto safe-area per iPhone;
- manifest PWA incluso.

## Flusso Clerk

La home, la ricerca e i dettagli evento sono pubblici.

Clerk viene richiesto per:

- unirsi a un gruppo;
- creare un evento;
- aprire "I miei eventi";
- notifiche;
- profilo;
- chat;
- check-in;
- segnalazioni e blocchi.

Se l'utente clicca "Unisciti" da guest, dopo il login torna all'evento e l'iscrizione viene completata automaticamente se il profilo è già completo. Se mancano i dati sociali, si apre prima l'onboarding.

## Funzionalità già presenti nel prototipo

- modalità guest reale;
- Clerk login / signup / logout;
- onboarding profilo;
- profilo modificabile;
- eventi persistenti in localStorage;
- ricerca eventi;
- filtri per categoria;
- ordinamento per data, quorum e posti;
- eventi salvati / preferiti;
- tab Partecipo / Creati / Salvati;
- creazione evento in due step;
- validazione data, quorum e capienza;
- modifica evento per il creatore;
- annullamento evento;
- iscrizione e abbandono gruppo;
- raggiungimento automatico del quorum;
- chat partecipanti;
- contatti protetti;
- condivisione evento via Web Share / clipboard;
- check-in con finestra temporale;
- notifiche, lettura e pulizia;
- preferenze notifiche;
- privacy Instagram / età;
- blocco utenti;
- segnalazione utenti ed eventi;
- regole community;
- area B2B visibile solo a `PARTNER` / `ADMIN`;
- pagina privacy e termini placeholder;
- manifest PWA.

## File da copiare

- `app/page.tsx`
- `app/layout.tsx`
- `app/manifest.ts`
- `app/_components/LodidentroApp.tsx`
- `app/_components/lodidentro/types.ts`
- `app/_components/lodidentro/data.ts`
- `app/_components/lodidentro/utils.ts`
- `app/sign-in/[[...sign-in]]/page.tsx`
- `app/sign-up/[[...sign-up]]/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/loading.tsx`
- `app/error.tsx`
- `app/not-found.tsx`
- `proxy.ts`

Non sovrascrivere `.env`, `prisma/`, `app/prisma.ts` o le tue server actions.

## Variabili Clerk

Mantieni le chiavi che hai già configurato. Se non sono presenti, sono utili anche:

```env
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_SIGN_IN_FALLBACK_REDIRECT_URL=/
NEXT_PUBLIC_CLERK_SIGN_UP_FALLBACK_REDIRECT_URL=/
```

## Nota importante sul backend

Questa versione completa le funzionalità del prototipo frontend e persiste i dati nel browser per permetterti di provarle subito. Non è ancora il modello dati finale di produzione.

Prima del lancio reale conviene spostare su Prisma/API:

- profilo Lodidentro;
- eventi;
- partecipazioni;
- chat;
- notifiche;
- segnalazioni;
- blocchi;
- preferiti;
- check-in;
- ruoli partner/admin.

Clerk deve rimanere responsabile dell'identità e della sessione; Prisma deve essere la fonte dati dell'app.
