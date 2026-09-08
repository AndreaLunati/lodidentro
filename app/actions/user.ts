'use server';

import { auth, currentUser } from '@clerk/nextjs/server';
import { prisma } from '@/app/prisma';

export async function syncUserWithDatabase() {
  try {
    const { userId } = await auth();
    if (!userId) return null;

    const user = await currentUser();
    if (!user) return null;

    const phone = user.phoneNumbers?.[0]?.phoneNumber || `no-phone-${userId}`;

    // Usiamo upsert inviando solo i campi corretti previsti dal tuo schema Prisma
    const dbUser = await prisma.user.upsert({
      where: { id: userId },
      update: {
        // Aggiorna qui i campi che effettivamente esistono nel tuo modello User di Prisma (es. phone)
        phone: phone,
      },
      create: {
        id: userId,
        phone: phone,
      },
    });

    return dbUser;
  } catch (error) {
    console.error('Errore nella sincronizzazione dell\'utente con Prisma:', error);
    return null;
  }
}