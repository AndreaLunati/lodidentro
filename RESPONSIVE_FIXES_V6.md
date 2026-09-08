# Lodidentro v6 — responsive + Clerk overflow fix

## Correzioni principali

- Eliminato lo scroll orizzontale del widget Clerk nelle schermate di login/registrazione.
- Clerk ora rispetta sempre la larghezza disponibile nel frame (`min-width: 0`, `max-width: 100%`).
- Ridotto il padding annidato attorno a `SignIn` / `SignUp`.
- Avatar dell'header reso resistente a immagini Clerk/Google non caricabili, con fallback alla iniziale.
- Layout responsive per smartphone, iPad/tablet portrait e landscape.
- Fino a 1279px il layout usa una superficie app più ampia (max 820px); da 1280px torna alla preview compatta 430x900 richiesta per desktop.
- Onboarding: campi a due colonne solo quando c'è spazio; su mobile tornano a una colonna.
- Modal principali più larghe su tablet (max 560px).

## Breakpoint principali

- `< 640px`: app full-screen.
- `640–1279px`: app tablet, fino a 820px di larghezza.
- `>= 1280px`: frame desktop compatto 430x900.

Non modificare `.env`, Prisma o le tue chiavi Clerk.
