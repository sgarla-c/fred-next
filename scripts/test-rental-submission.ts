import { chromium } from 'playwright';

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Login
  await page.goto('http://localhost:3100/login');
  await page.fill('#username', 'testuser1');
  await page.fill('#password', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/**', { timeout: 10000 }).catch(() => {});

  // Navigate to rental form
  await page.goto('http://localhost:3100/rental/new');

  // Select District: Dallas
  await page.getByText('Select district', { exact: true }).click();
  await page.locator('[role="option"]:has-text("Dallas")').first().click();

  // Wait briefly for sections to load, then select Dallas Section (first option)
  await page.waitForTimeout(500);
  await page.getByText('Select section', { exact: true }).click();
  await page.locator('[role="option"]').first().click();

  // Select NIGP (first option)
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

  // Unit defaults to Months; no selection needed

  await page.fill('#dlvryLocn', '123 Main St, Austin, TX');
  await page.fill('#pocNm', 'John Contact');
  await page.fill('#pocPhnNbr', '(512) 555-1212');

  // Submit
  await page.click('button[type="submit"]');
  await page.waitForURL('**/es/rentals', { timeout: 10000 });

  // Verify submission by checking presence of a card with status Submitted
  const submittedBadge = page.locator('text=Submitted');
  const exists = await submittedBadge.first().isVisible().catch(() => false);
  console.log(`Submission status badge visible: ${exists}`);

  await browser.close();
  if (!exists) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
