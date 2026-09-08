import { clerkMiddleware } from '@clerk/nextjs/server';

// Tutte le route restano intercettate da Clerk. Le route private vengono
// protette vicino alla risorsa con auth.protect() nelle singole pagine/actions.
export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
    '/__clerk/(.*)',
  ],
};
