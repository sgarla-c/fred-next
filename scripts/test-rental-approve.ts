import { chromium } from 'playwright';

async function submitRentalAndGetId(page: any) {
  // Login ES
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'testuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/**', { timeout: 10000 }).catch(() => {});

  // Navigate to rental form
  await page.goto('http://localhost:3100/rental/new');

  // Select Dallas district
  await page.getByText('Select district', { exact: true }).click();
  await page.locator('[role="option"]:has-text("Dallas")').first().click();

  // Wait for sections and choose first
  await page.waitForTimeout(500);
  await page.getByText('Select section', { exact: true }).click();
  await page.locator('[role="option"]').first().click();

  // Select NIGP
  await page.getByText('Select equipment type', { exact: true }).click();
  await page.locator('[role="option"]').first().click();

  // Fill required fields
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  const dateStr = `${yyyy}-${mm}-${dd}`;

  await page.fill('#eqpmtQty', '1');
  await page.fill('#dlvryRqstDt', dateStr);
  await page.fill('#durLngth', '1');
  await page.fill('#dlvryLocn', '456 Elm St, Dallas, TX');
  await page.fill('#pocNm', 'ES Contact');
  await page.fill('#pocPhnNbr', '(214) 555-0000');

  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/rentals', { timeout: 10000 });

  // Submission complete; ID not needed
  return;
}

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  await submitRentalAndGetId(page);
  console.log(`Submitted rental`);

  // Login RC (new context to avoid ES session)
  await context.clearCookies();
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'rcuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/rc/**', { timeout: 10000 }).catch(() => {});

  // Open RC rentals list and process the most recent Submitted rental
  await page.goto(`http://localhost:3100/rc/rentals`);
  // Click first visible Process button
  const processBtn = page.getByRole('button', { name: 'Process' }).first();
  await processBtn.click();
  await page.getByRole('button', { name: 'Approve & Activate' }).click();

  // Verify status Active visible on the page
  const isActive = await page.getByText('Active').first().isVisible().catch(() => false);
  console.log(`Active status visible: ${isActive}`);

  await browser.close();
  if (!isActive) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
