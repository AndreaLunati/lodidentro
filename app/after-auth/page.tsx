import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { safeRedirect } from '../_components/authUtils';

export default async function AfterAuthPage({ searchParams }: { searchParams: Promise<{ intent?: string | string[]; redirect_url?: string | string[] }> }) {
  await auth.protect();
  const params = await searchParams;
  const intent = (Array.isArray(params.intent) ? params.intent[0] : params.intent) === 'venue' ? 'venue' : 'user';
  const redirectUrl = safeRedirect(params.redirect_url);
  const user = await currentUser();
  const role = String(user?.publicMetadata?.role ?? '');

  if (role === 'VENUE') redirect('/locale');
  if (role === 'USER') redirect(redirectUrl);
  if (role === 'ADMIN') redirect('/');

  const target = intent === 'venue' ? '/onboarding/venue' : `/onboarding/user?redirect_url=${encodeURIComponent(redirectUrl)}`;
  redirect(target);
}
