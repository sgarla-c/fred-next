/**
 * Export Prisma Data to JSON
 * Creates a JSON export of all database tables
 */

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { join } from 'path';

const prisma = new PrismaClient();

async function exportData() {
  const timestamp = process.argv[2] || new Date().toISOString().replace(/[:.]/g, '-').split('T')[0] + '_' + 
                    new Date().toTimeString().split(' ')[0].replace(/:/g, '-');
  const backupFile = join(process.cwd(), 'backups', `prisma_data_${timestamp}.json`);

  console.log('🔄 Exporting Prisma data to JSON...');

  try {
    const data = {
      metadata: {
        exportDate: new Date().toISOString(),
        version: '1.0',
      },
      districts: await prisma.district.findMany(),
      sections: await prisma.section.findMany(),
      users: await prisma.user.findMany({ select: {
        userId: true,
        userName: true,
        userEmail: true,
        userRole: true,
        distNbr: true,
        sectId: true,
        createdAt: true,
        updatedAt: true,
        // Exclude password hash
      }}),
      nigpCodes: await prisma.nigp.findMany(),
      rentals: await prisma.rental.findMany(),
      rentalStatusHistory: await prisma.rentalStatusHistory.findMany(),
      rentalAttachments: await prisma.rentalAttachment.findMany(),
      purchaseOrders: await prisma.purchaseOrder.findMany(),
      rentalPurchaseOrderLinks: await prisma.rentalPurchaseOrderLink.findMany(),
      invoices: await prisma.invoice.findMany(),
      invoiceLines: await prisma.invoiceLine.findMany(),
      claims: await prisma.claim.findMany(),
    };

    writeFileSync(backupFile, JSON.stringify(data, null, 2));

    const sizeKB = (require('fs').statSync(backupFile).size / 1024).toFixed(2);
    console.log('✅ Prisma data export completed!');
    console.log(`📦 Export file: ${backupFile}`);
    console.log(`💾 Size: ${sizeKB} KB`);

    return backupFile;
  } catch (error) {
    console.error('❌ Export failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

exportData();
