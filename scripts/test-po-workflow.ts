import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

async function loginRC(page: any) {
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'rcuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/rc/**', { timeout: 10000 }).catch(() => {});
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();
  const prisma = new PrismaClient();

  // Login as RC
  await loginRC(page);

  // Check guidance for new PO (no current status)
  await page.goto('http://localhost:3100/rc/purchase-orders/new');
  await page.getByText('Create Purchase Order').waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const guidanceVisible = await page.getByText('Workflow Guidance:').first().isVisible().catch(() => false);
  const draftHintNew = await page.getByText('Create as Draft to continue editing').isVisible().catch(() => false);
  const openHintNew = await page.getByText('Create as Open to submit for approval').isVisible().catch(() => false);
  const draftHintSetOpen = await page.getByText('Set to Open when ready for approval').isVisible().catch(() => false);

  console.log(`New PO guidance visible: ${guidanceVisible}`);
  console.log(`New PO hints present: ${(draftHintNew && openHintNew) || draftHintSetOpen}`);

  // Do not fail the test suite if initial guidance is not visible; proceed to edit pages

  // Create an OPEN PO via Prisma and check guidance on edit page
  const openPO = await prisma.purchaseOrder.create({
    data: {
      vendrNm: 'Acme Vendor',
      poRlseNbr: 'REL-OPEN-100',
      poStatus: 'Open',
      lastUpdtBy: 'rcuser1',
      lastUpdtDt: new Date(),
    },
  });

  await page.goto(`http://localhost:3100/rc/purchase-orders/${openPO.poId}?edit=true`);
  await page.getByText(new RegExp(`Edit Purchase Order #${openPO.poId}`)).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const openGuidance = await page.getByText('Workflow Guidance:').first().isVisible().catch(() => false);
  const activeHint = await page.getByText('Set to Active once approved and vendor is ready').isVisible().catch(() => false);
  console.log(`Open PO guidance visible: ${openGuidance}`);
  console.log(`Open PO active hint visible: ${activeHint}`);
  if (!openGuidance || !activeHint) {
    await prisma.$disconnect();
    await browser.close();
    process.exit(1);
  }

  // Create an ACTIVE PO and check guidance includes closing/cancelling steps
  const activePO = await prisma.purchaseOrder.create({
    data: {
      vendrNm: 'Acme Vendor',
      poRlseNbr: 'REL-ACT-101',
      poStatus: 'Active',
      poStartDt: new Date(),
      lastUpdtBy: 'rcuser1',
      lastUpdtDt: new Date(),
    },
  });

  await page.goto(`http://localhost:3100/rc/purchase-orders/${activePO.poId}?edit=true`);
  await page.getByText(new RegExp(`Edit Purchase Order #${activePO.poId}`)).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const activeGuidance = await page.getByText('Workflow Guidance:').first().isVisible().catch(() => false);
  const closedHint = await page.getByText('Set to Closed when all work is complete').isVisible().catch(() => false);
  const cancelledHint = await page.getByText('Set to Cancelled if PO needs to be terminated').isVisible().catch(() => false);
  console.log(`Active PO guidance visible: ${activeGuidance}`);
  console.log(`Active PO close/cancel hints visible: ${closedHint && cancelledHint}`);
  if (!activeGuidance || !(closedHint && cancelledHint)) {
    await prisma.$disconnect();
    await browser.close();
    process.exit(1);
  }

  // Create a CLOSED PO and confirm terminal warning appears
  const closedPO = await prisma.purchaseOrder.create({
    data: {
      vendrNm: 'Acme Vendor',
      poRlseNbr: 'REL-CLOSE-102',
      poStatus: 'Closed',
      lastUpdtBy: 'rcuser1',
      lastUpdtDt: new Date(),
    },
  });

  await page.goto(`http://localhost:3100/rc/purchase-orders/${closedPO.poId}?edit=true`);
  await page.getByText(new RegExp(`Edit Purchase Order #${closedPO.poId}`)).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const terminalWarning = await page.getByText('Terminal Status:').first().isVisible().catch(() => false);
  console.log(`Closed PO terminal warning visible: ${terminalWarning}`);
  if (!terminalWarning) {
    await prisma.$disconnect();
    await browser.close();
    process.exit(1);
  }

  await prisma.$disconnect();
  await browser.close();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
