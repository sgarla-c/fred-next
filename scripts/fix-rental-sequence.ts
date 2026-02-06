import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('postgres:', 'localhost:') || 'postgresql://fred_user:fred_password_dev@localhost:5432/fred_poc'
    }
  }
});

async function fixRentalSequence() {
  try {
    console.log('Fixing RENTAL table sequence...');
    
    // Reset the RENTAL_ID sequence
    const result = await prisma.$queryRaw`
      SELECT setval(
        pg_get_serial_sequence('"RENTAL"', 'RENTAL_ID'),
        COALESCE((SELECT MAX("RENTAL_ID") FROM "RENTAL"), 0) + 1,
        false
      )
    `;
    
    console.log('✅ Sequence fixed successfully!');
    console.log('Result:', result);
    
    // Verify by checking the next value
    const nextVal = await prisma.$queryRaw`
      SELECT currval(pg_get_serial_sequence('"RENTAL"', 'RENTAL_ID')) as current_value
    `;
    
    console.log('Current sequence value:', nextVal);
    
  } catch (error) {
    console.error('❌ Error fixing sequence:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

fixRentalSequence();
