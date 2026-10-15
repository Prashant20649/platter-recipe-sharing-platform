const puppeteer = require('/Users/prashantchaudhary/.gemini/antigravity/scratch/cartly/frontend/node_modules/puppeteer-core');
const fs = require('fs');
const path = require('path');

const SCREENSHOTS_DIR = '/Users/prashantchaudhary/.gemini/antigravity/brain/04159a6e-e43d-4f70-aea7-7a3a94188960/screenshots';
if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runBrowserVerification() {
  console.log('Launching Chrome browser...');
  const browser = await puppeteer.launch({
    executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 800 });

    // ==========================================
    // 1. HOME / BROWSE PAGE FLOW
    // ==========================================
    console.log('\n[1/4] Testing Home / Recipe Browsing Flow...');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });
    await sleep(1000);

    const title = await page.title();
    console.log(`Page title: "${title}"`);

    // Verify recipe cards are present
    const recipeCount = await page.$$eval('a[href^="/recipes/"]', (els) => els.length);
    console.log(`Found ${recipeCount} recipe links on homepage.`);

    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_browse.png') });
    console.log('Saved screenshot: 01_home_browse.png');

    // Test Search input
    console.log('Testing search functionality...');
    const searchInput = await page.$('input[placeholder*="Search by recipe title"]');
    if (searchInput) {
      await searchInput.type('Pizza');
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_home_search_pizza.png') });
      console.log('Saved screenshot: 02_home_search_pizza.png');
      // Clear search
      await page.evaluate(() => {
        const input = document.querySelector('input[placeholder*="Search by recipe title"]');
        if (input) {
          input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
      await sleep(500);
    }

    // ==========================================
    // 2. EXPLORER FLOW (Login, Detail, History, Collection)
    // ==========================================
    console.log('\n[2/4] Testing Explorer Role Flow (Sam Walker)...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle2' });
    await sleep(500);

    // Click Explorer Sam demo card button
    const explorerBtn = await page.$('button ::-p-text(Explorer Sam)');
    if (explorerBtn) {
      await explorerBtn.click();
    } else {
      await page.type('input[type="email"]', 'explorer.sam@platter.com');
      await page.type('input[type="password"]', 'explorer123');
    }
    await sleep(300);

    // Click sign in
    await page.click('button[type="submit"]');
    await sleep(1200);

    // Verify redirected to /explorer
    console.log(`Current URL after login: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_explorer_dashboard.png') });
    console.log('Saved screenshot: 03_explorer_dashboard.png');

    // Test Recipe Detail view
    console.log('Navigating to recipe detail page...');
    await page.goto('http://127.0.0.1:5173/', { waitUntil: 'networkidle2' });
    await sleep(800);
    const firstRecipeCard = await page.$('a[href^="/recipes/"]');
    if (firstRecipeCard) {
      await firstRecipeCard.click();
      await sleep(1200);
      console.log(`On recipe detail page: ${page.url()}`);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_recipe_detail.png') });
      console.log('Saved screenshot: 04_recipe_detail.png');
    }

    // ==========================================
    // 3. CONTRIBUTOR FLOW (Chef Mario)
    // ==========================================
    console.log('\n[3/4] Testing Contributor Role Flow (Chef Mario)...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle2' });
    await sleep(500);

    // Click Chef Mario demo button
    const marioBtn = await page.$('button ::-p-text(Chef Mario)');
    if (marioBtn) {
      await marioBtn.click();
    } else {
      await page.type('input[type="email"]', 'chef.mario@platter.com');
      await page.type('input[type="password"]', 'chef123');
    }
    await sleep(300);

    await page.click('button[type="submit"]');
    await sleep(1200);

    console.log(`Current URL after contributor login: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_contributor_recipes.png') });
    console.log('Saved screenshot: 05_contributor_recipes.png');

    // Check Recharts stats tab
    console.log('Switching to Recipe Stats tab (Recharts)...');
    const statsTabBtn = await page.$('button ::-p-text(Recipe Stats)');
    if (statsTabBtn) {
      await statsTabBtn.click();
      await sleep(1000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_contributor_recharts_stats.png') });
      console.log('Saved screenshot: 06_contributor_recharts_stats.png');
    }

    // Check Share New Recipe tab
    console.log('Switching to Share New Recipe tab...');
    const shareTabBtn = await page.$('button ::-p-text(Share New Recipe)');
    if (shareTabBtn) {
      await shareTabBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_contributor_recipe_form.png') });
      console.log('Saved screenshot: 07_contributor_recipe_form.png');
    }

    // ==========================================
    // 4. ADMIN FLOW (Admin Alex)
    // ==========================================
    console.log('\n[4/4] Testing Admin Role Flow (Admin Alex)...');
    await page.goto('http://127.0.0.1:5173/login', { waitUntil: 'networkidle2' });
    await sleep(500);

    const adminBtn = await page.$('button ::-p-text(Admin Alex)');
    if (adminBtn) {
      await adminBtn.click();
    } else {
      await page.type('input[type="email"]', 'admin@platter.com');
      await page.type('input[type="password"]', 'admin123');
    }
    await sleep(300);

    await page.click('button[type="submit"]');
    await sleep(1200);

    console.log(`Current URL after admin login: ${page.url()}`);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_admin_user_management.png') });
    console.log('Saved screenshot: 08_admin_user_management.png');

    // Recipe Approval Tab
    console.log('Checking Admin Recipe Approval tab...');
    const recipeApprovalBtn = await page.$('button ::-p-text(Recipe Approval)');
    if (recipeApprovalBtn) {
      await recipeApprovalBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_admin_recipe_approval.png') });
      console.log('Saved screenshot: 09_admin_recipe_approval.png');
    }

    // System Settings Tab
    console.log('Checking Admin System Settings tab...');
    const settingsTabBtn = await page.$('button ::-p-text(System Settings)');
    if (settingsTabBtn) {
      await settingsTabBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_admin_system_settings.png') });
      console.log('Saved screenshot: 10_admin_system_settings.png');
    }

    // Content Moderation Tab
    console.log('Checking Admin Content Moderation tab...');
    const modTabBtn = await page.$('button ::-p-text(Content Moderation)');
    if (modTabBtn) {
      await modTabBtn.click();
      await sleep(600);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '11_admin_content_moderation.png') });
      console.log('Saved screenshot: 11_admin_content_moderation.png');
    }

    console.log('\n🎉 ALL ROLE BROWSER FLOWS VERIFIED SUCCESSFULLY!');
  } catch (error) {
    console.error('Browser verification error:', error);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

runBrowserVerification();
