const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...\n');

  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const doctorPassword = await bcrypt.hash('Doctor@123', 12);
  const patientPassword = await bcrypt.hash('Patient@123', 12);

  // ─── ADMIN ───
  const admin = await prisma.user.upsert({
    where: { email: 'admin@medix.com' },
    update: {},
    create: {
      email: 'admin@medix.com',
      passwordHash: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
  });
  console.log('✅ Admin:', admin.email);

  // ─── DOCTORS ───
  const doctorsData = [
    {
      email: 'dr.smith@medix.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+1234567890',
      profile: {
        specialization: 'Cardiologist',
        licenseNumber: 'MD-2024-001',
        department: 'CARDIOLOGY',
        experienceYears: 12,
        consultationFee: 15000,
        bio: 'Board certified cardiologist with 12 years of experience.',
        qualifications: ['MD', 'FACC', 'Board Certified Cardiologist'],
        isAvailable: true,
        schedule: {
          monday: { start: '09:00', end: '17:00' },
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' },
        },
      },
    },
    {
      email: 'dr.patel@medix.com',
      firstName: 'Priya',
      lastName: 'Patel',
      phone: '+1234567891',
      profile: {
        specialization: 'Neurologist',
        licenseNumber: 'MD-2024-002',
        department: 'NEUROLOGY',
        experienceYears: 8,
        consultationFee: 18000,
        bio: 'Specialist in neurodegenerative diseases and stroke management.',
        qualifications: ['MD', 'DM Neurology', 'Fellowship in Movement Disorders'],
        isAvailable: true,
        schedule: {
          monday: { start: '10:00', end: '18:00' },
          wednesday: { start: '10:00', end: '18:00' },
          friday: { start: '10:00', end: '16:00' },
        },
      },
    },
    {
      email: 'dr.wilson@medix.com',
      firstName: 'Sarah',
      lastName: 'Wilson',
      phone: '+1234567892',
      profile: {
        specialization: 'General Physician',
        licenseNumber: 'MD-2024-003',
        department: 'GENERAL_MEDICINE',
        experienceYears: 15,
        consultationFee: 10000,
        bio: 'Experienced general physician for primary care.',
        qualifications: ['MBBS', 'MD Internal Medicine'],
        isAvailable: true,
        schedule: {
          monday: { start: '08:00', end: '16:00' },
          tuesday: { start: '08:00', end: '16:00' },
          wednesday: { start: '08:00', end: '16:00' },
          thursday: { start: '08:00', end: '16:00' },
          friday: { start: '08:00', end: '14:00' },
        },
      },
    },
    {
      email: 'dr.chen@medix.com',
      firstName: 'Wei',
      lastName: 'Chen',
      phone: '+1234567893',
      profile: {
        specialization: 'Pediatrician',
        licenseNumber: 'MD-2024-004',
        department: 'PEDIATRICS',
        experienceYears: 10,
        consultationFee: 12000,
        bio: 'Caring pediatrician specializing in child development.',
        qualifications: ['MD', 'DCH', 'Fellowship in Pediatric Care'],
        isAvailable: true,
        schedule: {
          tuesday: { start: '09:00', end: '17:00' },
          wednesday: { start: '09:00', end: '17:00' },
          thursday: { start: '09:00', end: '17:00' },
          friday: { start: '09:00', end: '15:00' },
        },
      },
    },
  ];

  for (const d of doctorsData) {
    const user = await prisma.user.upsert({
      where: { email: d.email },
      update: {},
      create: {
        email: d.email,
        passwordHash: doctorPassword,
        firstName: d.firstName,
        lastName: d.lastName,
        role: 'DOCTOR',
        phone: d.phone,
        isActive: true,
      },
    });

    await prisma.doctorProfile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        specialization: d.profile.specialization,
        licenseNumber: d.profile.licenseNumber,
        department: d.profile.department,
        experienceYears: d.profile.experienceYears,
        consultationFee: d.profile.consultationFee,
        bio: d.profile.bio,
        qualifications: d.profile.qualifications,
        isAvailable: d.profile.isAvailable,
        schedule: d.profile.schedule,
      },
    });

    console.log('✅ Doctor:', d.firstName, d.lastName);
  }

  // ─── RECEPTIONIST ───
  const receptionistPassword = await bcrypt.hash('Reception@123', 12);
  await prisma.user.upsert({
    where: { email: 'receptionist@medix.com' },
    update: {},
    create: {
      email: 'receptionist@medix.com',
      passwordHash: receptionistPassword,
      firstName: 'Emma',
      lastName: 'Brown',
      role: 'RECEPTIONIST',
      phone: '+1234567894',
      isActive: true,
    },
  });
  console.log('✅ Receptionist: Emma Brown');

  // ─── LAB TECH ───
  const labTechPassword = await bcrypt.hash('LabTech@123', 12);
  await prisma.user.upsert({
    where: { email: 'labtech@medix.com' },
    update: {},
    create: {
      email: 'labtech@medix.com',
      passwordHash: labTechPassword,
      firstName: 'James',
      lastName: 'Miller',
      role: 'LAB_TECH',
      phone: '+1234567895',
      isActive: true,
    },
  });
  console.log('✅ Lab Tech: James Miller');

  // ─── PHARMACIST ───
  const pharmacistPassword = await bcrypt.hash('Pharma@123', 12);
  await prisma.user.upsert({
    where: { email: 'pharmacist@medix.com' },
    update: {},
    create: {
      email: 'pharmacist@medix.com',
      passwordHash: pharmacistPassword,
      firstName: 'Olivia',
      lastName: 'Garcia',
      role: 'PHARMACIST',
      phone: '+1234567896',
      isActive: true,
    },
  });
  console.log('✅ Pharmacist: Olivia Garcia');
  

  // ─── PATIENTS ───
  const pat1 = await prisma.user.upsert({
    where: { email: 'patient@medix.com' },
    update: {},
    create: {
      email: 'patient@medix.com',
      passwordHash: patientPassword,
      firstName: 'Alice',
      lastName: 'Johnson',
      role: 'PATIENT',
      phone: '+1987654321',
      isActive: true,
    },
  });

  await prisma.patient.upsert({
    where: { userId: pat1.id },
    update: {},
    create: {
      userId: pat1.id,
      mrn: 'MRN-2024-0001',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'FEMALE',
      bloodGroup: 'O+',
      allergies: ['Penicillin', 'Peanuts'],
      emergencyName: 'Bob Johnson',
      emergencyPhone: '+1987654322',
      emergencyRelation: 'Spouse',
      addressLine1: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA',
      insuranceProvider: 'BlueCross',
      insurancePolicyNo: 'BC-2024-987654',
      consentSigned: true,
    },
  });
  console.log('✅ Patient: Alice Johnson');

  const pat2 = await prisma.user.upsert({
    where: { email: 'mike@medix.com' },
    update: {},
    create: {
      email: 'mike@medix.com',
      passwordHash: patientPassword,
      firstName: 'Mike',
      lastName: 'Davis',
      role: 'PATIENT',
      phone: '+1555123456',
      isActive: true,
    },
  });

  await prisma.patient.upsert({
    where: { userId: pat2.id },
    update: {},
    create: {
      userId: pat2.id,
      mrn: 'MRN-2024-0002',
      dateOfBirth: new Date('1985-11-20'),
      gender: 'MALE',
      bloodGroup: 'A+',
      allergies: [],
      emergencyName: 'Jane Davis',
      emergencyPhone: '+1555123457',
      emergencyRelation: 'Wife',
      addressLine1: '456 Oak Ave',
      city: 'New York',
      state: 'NY',
      zipCode: '10002',
      country: 'USA',
      consentSigned: true,
    },
  });
  console.log('✅ Patient: Mike Davis');

  console.log('\n🎉 Seeding complete!\n');
  console.log('📋 Test Accounts:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Admin:   admin@medix.com      / Admin@123');
  console.log('Doctor:  dr.smith@medix.com   / Doctor@123');
  console.log('Doctor:  dr.patel@medix.com   / Doctor@123');
  console.log('Doctor:  dr.wilson@medix.com  / Doctor@123');
  console.log('Doctor:  dr.chen@medix.com    / Doctor@123');
  console.log('Patient: patient@medix.com    / Patient@123');
  console.log('Patient: mike@medix.com       / Patient@123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });