import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import VenueApp from '../_components/VenueApp';

export default async function VenuePage() {
  await auth.protect();
  const user = await currentUser();
  const role = String(user?.publicMetadata?.role ?? '');
  if (!role) redirect('/onboarding/venue');
  if (role !== 'VENUE' && role !== 'ADMIN') redirect('/');
  return <VenueApp />;
}
