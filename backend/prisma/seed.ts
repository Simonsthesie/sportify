import { PrismaClient, RoleLibelle, StatutReservation } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('Password123!', 10);

  for (const libelle of ['ADMIN', 'COACH', 'CLIENT'] as RoleLibelle[]) {
    await prisma.role.upsert({
      where: { libelle },
      update: {},
      create: { libelle },
    });
  }

  const roleAdmin = await prisma.role.findUnique({ where: { libelle: 'ADMIN' } });
  const roleCoach = await prisma.role.findUnique({ where: { libelle: 'COACH' } });
  const roleClient = await prisma.role.findUnique({ where: { libelle: 'CLIENT' } });

  if (!roleAdmin || !roleCoach || !roleClient) {
    throw new Error('Roles non initialises');
  }

  const admin = await prisma.utilisateur.upsert({
    where: { email: 'admin@sportify.test' },
    update: {},
    create: {
      email: 'admin@sportify.test',
      motDePasse: passwordHash,
      nom: 'Admin',
      prenom: 'Super',
      roleId: roleAdmin.id,
    },
  });

  const coachUser1 = await prisma.utilisateur.upsert({
    where: { email: 'coach1@sportify.test' },
    update: {},
    create: {
      email: 'coach1@sportify.test',
      motDePasse: passwordHash,
      nom: 'Durand',
      prenom: 'Marie',
      roleId: roleCoach.id,
    },
  });
  const coach1 = await prisma.coach.upsert({
    where: { utilisateurId: coachUser1.id },
    update: {},
    create: {
      utilisateurId: coachUser1.id,
      specialite: 'Yoga & Pilates',
      bio: 'Coach certifiee RYT-500 avec 8 ans d experience.',
    },
  });

  const coachUser2 = await prisma.utilisateur.upsert({
    where: { email: 'coach2@sportify.test' },
    update: {},
    create: {
      email: 'coach2@sportify.test',
      motDePasse: passwordHash,
      nom: 'Martin',
      prenom: 'Lucas',
      roleId: roleCoach.id,
    },
  });
  const coach2 = await prisma.coach.upsert({
    where: { utilisateurId: coachUser2.id },
    update: {},
    create: {
      utilisateurId: coachUser2.id,
      specialite: 'Crossfit & HIIT',
      bio: 'Ancien athlete de haut niveau.',
    },
  });

  const client1 = await prisma.utilisateur.upsert({
    where: { email: 'client1@sportify.test' },
    update: {},
    create: {
      email: 'client1@sportify.test',
      motDePasse: passwordHash,
      nom: 'Dupont',
      prenom: 'Jean',
      roleId: roleClient.id,
    },
  });

  const client2 = await prisma.utilisateur.upsert({
    where: { email: 'client2@sportify.test' },
    update: {},
    create: {
      email: 'client2@sportify.test',
      motDePasse: passwordHash,
      nom: 'Bernard',
      prenom: 'Sophie',
      roleId: roleClient.id,
    },
  });

  const now = new Date();
  const inDays = (d: number, h: number) => {
    const x = new Date(now);
    x.setDate(x.getDate() + d);
    x.setHours(h, 0, 0, 0);
    return x;
  };

  const existingSeances = await prisma.seance.count();
  if (existingSeances === 0) {
    const s1 = await prisma.seance.create({
      data: {
        titre: 'Yoga matinal',
        description: 'Reveil en douceur avec une seance de yoga.',
        dateDebut: inDays(1, 9),
        dateFin: inDays(1, 10),
        capaciteMax: 10,
        lieu: 'Salle 1',
        coachId: coach1.id,
      },
    });
    const s2 = await prisma.seance.create({
      data: {
        titre: 'Pilates debutant',
        description: 'Renforcement musculaire en douceur.',
        dateDebut: inDays(1, 11),
        dateFin: inDays(1, 12),
        capaciteMax: 8,
        lieu: 'Salle 1',
        coachId: coach1.id,
      },
    });
    const s3 = await prisma.seance.create({
      data: {
        titre: 'Crossfit WOD',
        description: 'Workout of the day - intense.',
        dateDebut: inDays(2, 18),
        dateFin: inDays(2, 19),
        capaciteMax: 12,
        lieu: 'Box A',
        coachId: coach2.id,
      },
    });
    await prisma.seance.create({
      data: {
        titre: 'HIIT cardio',
        description: 'Cardio fractionne haute intensite.',
        dateDebut: inDays(3, 19),
        dateFin: inDays(3, 20),
        capaciteMax: 15,
        lieu: 'Box A',
        coachId: coach2.id,
      },
    });

    await prisma.reservation.create({
      data: { clientId: client1.id, seanceId: s1.id, statut: StatutReservation.CONFIRMEE },
    });
    await prisma.reservation.create({
      data: { clientId: client2.id, seanceId: s3.id, statut: StatutReservation.CONFIRMEE },
    });
  }

  console.log('Seed termine.');
  console.log('Comptes (mot de passe = Password123!):');
  console.log('  ' + admin.email + ' (ADMIN)');
  console.log('  ' + coachUser1.email + ' (COACH)');
  console.log('  ' + coachUser2.email + ' (COACH)');
  console.log('  ' + client1.email + ' (CLIENT)');
  console.log('  ' + client2.email + ' (CLIENT)');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
