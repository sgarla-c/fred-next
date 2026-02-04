import { chromium } from 'playwright';
import { PrismaClient } from '@prisma/client';

async function submitRentalAndGetId(page: any, prisma: PrismaClient) {
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'testuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/**', { timeout: 10000 }).catch(() => {});

  await page.goto('http://localhost:3100/rental/new');
  await page.getByText('Select district', { exact: true }).click();
  await page.locator('[role="option"]:has-text("Dallas")').first().click();
  await page.waitForTimeout(500);
  await page.getByText('Select section', { exact: true }).click();
  await page.locator('[role="option"]').first().click();
  await page.getByText('Select equipment type', { exact: true }).click();
  await page.locator('[role="option"]').first().click();

  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  await page.fill('#eqpmtQty', '1');
  await page.fill('#dlvryRqstDt', dateStr);
  await page.fill('#durLngth', '1');
  await page.fill('#dlvryLocn', '789 Oak St, Dallas, TX');
  await page.fill('#pocNm', 'ES Contact');
  await page.fill('#pocPhnNbr', '(214) 555-3333');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/rentals', { timeout: 10000 });

  // Get the latest rental by ID
  const latest = await prisma.rental.findFirst({ orderBy: { rentalId: 'desc' } });
  if (!latest) throw new Error('No rental found after submission');
  return latest.rentalId;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const prisma = new PrismaClient();
  const rentalId = await submitRentalAndGetId(page, prisma);
  console.log(`Submitted rental #${rentalId}`);

  // Ensure status is Submitted so Deny button is available
  await prisma.rental.update({ where: { rentalId }, data: { rentStatus: 'Submitted' } });

  // Login RC and deny on a Submitted rental
  await context.clearCookies();
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'rcuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/rc/**', { timeout: 10000 }).catch(() => {});

  // Simulate denial via Prisma to ensure resubmit path is available
  await prisma.rental.update({
    where: { rentalId },
    data: {
      rentStatus: 'Denied',
      spclInst: '[DENIED]: Insufficient details',
    },
  });

  // Login ES and resubmit
  await context.clearCookies();
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'testuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/**', { timeout: 10000 }).catch(() => {});

  if (!rentalId) throw new Error('Unable to determine rental id after denial');
  await page.goto(`http://localhost:3100/es/rentals/${rentalId}/edit`);
  // Optional tweak
  await page.fill('#eqpmtModel', 'Updated Model');
  await page.click('button[type="submit"]');
  // After resubmit, wait for client-side navigation to detail page
  await page.waitForURL(`**/es/rentals/${rentalId}`, { timeout: 15000 }).catch(() => {});
  await page.waitForLoadState('networkidle').catch(() => {});
  await page.getByText(new RegExp(`Rental Request #${rentalId}`)).first().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
  const isSubmitted = await page.getByText('Submitted').first().isVisible().catch(() => false);
  console.log(`Submitted status visible after resubmit: ${isSubmitted}`);

  const dbStatus = await prisma.rental.findUnique({ where: { rentalId }, select: { rentStatus: true } });
  console.log(`DB rentStatus after resubmit: ${dbStatus?.rentStatus}`);

  // Fallback: read status badge text directly
  const statusBadge = page.locator('xpath=//p[contains(., "Status")]/following-sibling::p/span').first();
  const badgeText = await statusBadge.textContent().catch(() => null);
  if (badgeText) {
    console.log(`UI status badge text: ${badgeText.trim()}`);
  }

  await prisma.$disconnect();
  await browser.close();
  if (!isSubmitted) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
