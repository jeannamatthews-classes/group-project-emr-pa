import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // ── Update any unassigned users to student role for testing ──────────────
  const updated = await prisma.user.updateMany({
    where: { role: 'unassigned' },
    data: { role: 'student' },
  });
  if (updated.count > 0) {
    console.log(`✓ Updated ${updated.count} user(s) to role "student"`);
  }

  // ── Seed test cases ───────────────────────────────────────────────────────
  const cases = [
    {
      caseTitle: 'Acute Chest Pain',
      name: 'Marcus Rivera',
      location: 'Emergency Department',
      dob: new Date('1966-03-14'),
      gender: 'Male',
      codeStatus: 'Full Code',
      caseType: 'pbl',
      hasLabs: false,
    },
    {
      caseTitle: 'Type 2 Diabetes Follow-up',
      name: 'Linda Park',
      location: 'Internal Medicine Clinic',
      dob: new Date('1960-07-22'),
      gender: 'Female',
      codeStatus: 'Full Code',
      caseType: 'pbl',
      hasLabs: true,
    },
    {
      caseTitle: 'Community-Acquired Pneumonia',
      name: 'Samuel Okonkwo',
      location: 'Inpatient Ward B',
      dob: new Date('1990-11-05'),
      gender: 'Male',
      codeStatus: 'Full Code',
      caseType: 'pbl',
      hasLabs: true,
    },
    {
      caseTitle: 'Simulated Trauma Assessment',
      name: 'Alex Chen',
      location: 'Simulation Lab — Trauma Bay',
      dob: new Date('1997-04-30'),
      gender: 'Male',
      codeStatus: 'Full Code',
      caseType: 'sim',
      hasLabs: false,
    },
    {
      caseTitle: 'Simulated Cardiac Arrest',
      name: 'Diana Flores',
      location: 'Simulation Lab — ICU',
      dob: new Date('1953-09-18'),
      gender: 'Female',
      codeStatus: 'DNR/DNI',
      caseType: 'sim',
      hasLabs: false,
    },
    {
      caseTitle: 'Simulated Sepsis with Labs',
      name: 'James Whitmore',
      location: 'Simulation Lab — General Floor',
      dob: new Date('1979-01-27'),
      gender: 'Male',
      codeStatus: 'Full Code',
      caseType: 'sim',
      hasLabs: true,
    },
  ];

  let seeded = 0;
  for (const c of cases) {
    const existing = await prisma.patient.findFirst({
      where: { name: c.name, caseTitle: c.caseTitle },
    });
    if (!existing) {
      await prisma.patient.create({ data: c });
      seeded++;
    }
  }

  const total = await prisma.patient.count();
  console.log(`✓ Seeded ${seeded} new case(s) — ${total} total in database`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
