'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? '').trim();
}

function fail(path: string, message: string): never {
  redirect(`${path}?error=${encodeURIComponent(message)}`);
}

export async function completeUserOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in/user');

  const displayName = text(formData, 'displayName');
  const age = Number(text(formData, 'age'));
  const city = text(formData, 'city');
  const instagram = text(formData, 'instagram');
  const interests = formData.getAll('interests').map(String).filter(Boolean).slice(0, 6);
  const redirectUrl = text(formData, 'redirectUrl') || '/';

  if (displayName.length < 2) fail('/onboarding/user', 'Inserisci un nome valido.');
  if (!Number.isInteger(age) || age < 18 || age > 80) fail('/onboarding/user', 'Devi avere almeno 18 anni.');
  if (city.length < 2) fail('/onboarding/user', 'Inserisci la tua città.');
  if (interests.length === 0) fail('/onboarding/user', 'Scegli almeno un interesse.');

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: 'USER',
      onboardingCompleted: true,
    },
    unsafeMetadata: {
      displayName,
      age,
      city,
      instagram,
      interests,
    },
  });

  redirect(redirectUrl.startsWith('/') && !redirectUrl.startsWith('//') ? redirectUrl : '/');
}

export async function completeVenueOnboarding(formData: FormData) {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in/venue');

  const venueName = text(formData, 'venueName');
  const category = text(formData, 'category');
  const address = text(formData, 'address');
  const city = text(formData, 'city');
  const phone = text(formData, 'phone');
  const businessEmail = text(formData, 'businessEmail');
  const contactName = text(formData, 'contactName');
  const vatNumber = text(formData, 'vatNumber');
  const instagram = text(formData, 'instagram');
  const website = text(formData, 'website');

  if (venueName.length < 2) fail('/onboarding/venue', 'Inserisci il nome del locale.');
  if (!['RESTAURANT', 'BAR', 'SPORT_CENTER', 'OTHER'].includes(category)) fail('/onboarding/venue', 'Scegli una categoria valida.');
  if (address.length < 5 || city.length < 2) fail('/onboarding/venue', 'Inserisci indirizzo e città.');
  if (contactName.length < 2) fail('/onboarding/venue', 'Inserisci il nome del referente.');
  if (businessEmail.length < 5 || !businessEmail.includes('@')) fail('/onboarding/venue', 'Inserisci una email attività valida.');
  if (vatNumber.length < 8) fail('/onboarding/venue', 'Inserisci una P.IVA valida.');

  const client = await clerkClient();
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      role: 'VENUE',
      venueStatus: 'PENDING',
      onboardingCompleted: true,
    },
    unsafeMetadata: {
      venueName,
      venueCategory: category,
      venueAddress: address,
      venueCity: city,
      venuePhone: phone,
      venueEmail: businessEmail,
      venueContactName: contactName,
      venueVatNumber: vatNumber,
      venueInstagram: instagram,
      venueWebsite: website,
    },
  });

  redirect('/locale');
}
