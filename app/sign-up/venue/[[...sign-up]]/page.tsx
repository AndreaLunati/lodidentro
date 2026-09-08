import { SignUp } from '@clerk/nextjs';
import AuthFrame from '../../../_components/AuthFrame';
import { clerkAppearance } from '../../../_components/clerkAppearance';

export default function VenueSignUpPage() {
  const after = '/after-auth?intent=venue';
  return (
    <AuthFrame eyebrow="Nuovo partner" title="Registra il tuo locale." description="Prima crei l’account di accesso. Poi inserisci i dati dell’attività da inviare a Lodidentro per la verifica." backHref="/register">
      <div className="min-w-0 overflow-x-hidden rounded-[28px] border border-slate-200 bg-white p-2 shadow-sm sm:p-4 xl:p-2">
        <SignUp path="/sign-up/venue" routing="path" signInUrl="/sign-in/venue" forceRedirectUrl={after} signInForceRedirectUrl={after} appearance={clerkAppearance} unsafeMetadata={{ registrationIntent: 'VENUE' }} />
      </div>
    </AuthFrame>
  );
}
