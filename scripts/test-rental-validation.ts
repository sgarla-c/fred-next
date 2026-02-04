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

  // Try submitting without filling required fields
  await page.click('button[type="submit"]');

  // Ensure we did not navigate away (submission blocked)
  const url = page.url();
  const stayedOnForm = /\/rental\/new$/.test(url);
  console.log(`Stayed on form: ${stayedOnForm}`);

  // Count visible error messages rendered in red
  const errorLocators = page.locator('p.text-sm.text-red-600');
  const errorCount = await errorLocators.count();
  for (let i = 0; i < errorCount; i++) {
    console.log(`Error ${i + 1}: ${await errorLocators.nth(i).innerText()}`);
  }
  console.log(`Total errors visible: ${errorCount}`);

  const pass = stayedOnForm && errorCount >= 5;

  await browser.close();
  if (!pass) process.exit(1);
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
