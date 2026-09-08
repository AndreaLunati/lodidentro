import { SignUp } from '@clerk/nextjs';
import AuthFrame from '../../../_components/AuthFrame';
import { clerkAppearance } from '../../../_components/clerkAppearance';
import { safeRedirect } from '../../../_components/authUtils';

export default async function UserSignUpPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string | string[] }> }) {
  const params = await searchParams;
  const redirectUrl = safeRedirect(params.redirect_url);
  const after = `/after-auth?intent=user&redirect_url=${encodeURIComponent(redirectUrl)}`;
  return (
    <AuthFrame eyebrow="Nuovo utente" title="Entra nella community." description="Crea l’account Clerk. Subito dopo ti chiediamo solo le informazioni utili per partecipare ai gruppi." backHref="/register">
      <div className="min-w-0 overflow-x-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm sm:p-4 xl:p-2">
        <SignUp path="/sign-up/user" routing="path" signInUrl={`/sign-in/user?redirect_url=${encodeURIComponent(redirectUrl)}`} forceRedirectUrl={after} signInForceRedirectUrl={after} appearance={clerkAppearance} unsafeMetadata={{ registrationIntent: 'USER' }} />
      </div>
    </AuthFrame>
  );
}
