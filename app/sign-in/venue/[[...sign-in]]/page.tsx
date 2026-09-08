import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import AuthFrame from '../../../_components/AuthFrame';
import { clerkAppearance } from '../../../_components/clerkAppearance';

export default function VenueSignInPage() {
  const after = '/after-auth?intent=venue';
  return (
    <AuthFrame eyebrow="Lodidentro Partner" title="Accedi al tuo locale." description="Gestisci richieste, conferme, partecipanti e check-in dalla dashboard partner." backHref="/access">
      <div className="min-w-0 overflow-x-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm sm:p-4 xl:p-2">
        <SignIn path="/sign-in/venue" routing="path" signUpUrl="/sign-up/venue" forceRedirectUrl={after} signUpForceRedirectUrl={after} appearance={clerkAppearance} />
      </div>
      <p className="mt-5 text-center text-[10px] leading-5 text-slate-400">Vuoi partecipare agli eventi come persona? <Link href="/sign-in/user" className="font-bold text-slate-600 underline">Accesso utente</Link>.</p>
    </AuthFrame>
  );
}
