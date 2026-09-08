import { auth, currentUser } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import LodidentroApp from './_components/LodidentroApp';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) {
    const user = await currentUser();
    if (String(user?.publicMetadata?.role ?? '') === 'VENUE') redirect('/locale');
  }
  return <LodidentroApp />;
}
