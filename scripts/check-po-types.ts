import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL?.replace('postgres:', 'localhost:') || 'postgresql://fred_user:fred_password_dev@localhost:5432/fred_poc'
    }
  }
});

async function checkPOTypes() {
  try {
    console.log('Checking PO Types in database...\n');
    
    // Get distinct PO types
    const poTypes = await prisma.purchaseOrder.findMany({
      select: {
        poType: true,
      },
      distinct: ['poType'],
      orderBy: {
        poType: 'asc',
      },
    });
    
    console.log('Distinct PO Types found:');
    console.log('========================');
    poTypes.forEach((po, index) => {
      console.log(`${index + 1}. ${po.poType || '(null/empty)'}`);
    });
    
    // Get count for each type
    console.log('\nCounts by PO Type:');
    console.log('==================');
    for (const po of poTypes) {
      const count = await prisma.purchaseOrder.count({
        where: { poType: po.poType },
      });
      console.log(`${po.poType || '(null/empty)'}: ${count} POs`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

checkPOTypes();
