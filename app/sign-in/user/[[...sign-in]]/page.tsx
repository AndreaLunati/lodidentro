import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import AuthFrame from '../../../_components/AuthFrame';
import { clerkAppearance } from '../../../_components/clerkAppearance';
import { safeRedirect } from '../../../_components/authUtils';

export default async function UserSignInPage({ searchParams }: { searchParams: Promise<{ redirect_url?: string | string[] }> }) {
  const params = await searchParams;
  const redirectUrl = safeRedirect(params.redirect_url);
  const after = `/after-auth?intent=user&redirect_url=${encodeURIComponent(redirectUrl)}`;

  return (
    <AuthFrame eyebrow="Account utente" title="Bentornato su Lodidentro." description="Accedi per unirti ai gruppi, scrivere in chat, salvare eventi e gestire il tuo profilo." backHref="/access">
      <div className="min-w-0 overflow-x-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm sm:p-4 xl:p-2">
        <SignIn path="/sign-in/user" routing="path" signUpUrl={`/sign-up/user?redirect_url=${encodeURIComponent(redirectUrl)}`} forceRedirectUrl={after} signUpForceRedirectUrl={after} appearance={clerkAppearance} />
      </div>
      <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">Se gestisci un’attività, usa invece l’<Link href="/sign-in/venue" className="font-bold text-slate-600 underline">accesso locale</Link>.</p>
    </AuthFrame>
  );
}
