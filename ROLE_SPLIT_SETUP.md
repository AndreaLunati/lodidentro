# Lodidentro v5 — utenti e locali separati

Questa patch separa login, registrazione e interfaccia tra **USER** e **VENUE** usando Clerk.

## Flussi

- `/` → app consumer pubblica; un utente può esplorare senza login.
- `/access` → scelta accesso **Utente** / **Locale**.
- `/register` → scelta registrazione **Utente** / **Locale**.
- `/sign-in/user` e `/sign-up/user` → Clerk per utenti.
- `/sign-in/venue` e `/sign-up/venue` → Clerk per locali.
- `/after-auth` → legge `publicMetadata.role` e manda l'account nell'area corretta.
- `/onboarding/user` → nome, età, città, interessi.
- `/onboarding/venue` → dati attività, referente e P.IVA.
- `/locale` → dashboard partner 430×900 separata dall'app consumer.

## Metadata Clerk usati

`publicMetadata` (server-only in scrittura):

```ts
role: 'USER' | 'VENUE' | 'ADMIN'
venueStatus?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'SUSPENDED'
onboardingCompleted: boolean
```

`unsafeMetadata` contiene per ora i dati profilo/demo. Nel passaggio successivo spostali in Prisma.

## Importante per i locali

La registrazione assegna `venueStatus = PENDING`. Non fidarti mai di un flag impostato dal browser per approvare un locale. L'approvazione reale deve essere fatta da backend/admin.

## Clerk

Il codice usa la API attuale `await clerkClient()` + `client.users.updateUserMetadata(...)`.

Non sostituire le tue chiavi `.env`.

## Prossimo step consigliato

Portare role/profili/eventi/check-in in Prisma e lasciare a Clerk solo autenticazione e identità. La UI è già separata per farlo senza rifare il frontend.
