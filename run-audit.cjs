const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

async function run() {
  console.log('Starting Playwright Responsive Audit...');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const viewports = [320, 360, 375, 390, 414, 430, 768, 820, 1024, 1280, 1440, 1920];
  const publicRoutes = [
    { name: 'home', path: '/' },
    { name: 'courses', path: '/courses' },
    { name: 'auth', path: '/auth' },
    { name: 'signup', path: '/signup' },
    { name: 'verify-otp', path: '/verify-otp?email=architecturenextin%40gmail.com&purpose=signup' },
    { name: 'checkout', path: '/checkout' },
  ];

  const authRoutes = [
    { name: 'dashboard', path: '/dashboard' },
    { name: 'dashboard-courses', path: '/dashboard/courses' },
    { name: 'dashboard-purchases', path: '/dashboard/purchases' },
    { name: 'dashboard-profile', path: '/dashboard/profile' },
    { name: 'admin', path: '/admin' },
    { name: 'admin-courses', path: '/admin/courses' },
    { name: 'admin-students', path: '/admin/students' },
    { name: 'admin-payments', path: '/admin/payments' },
  ];

  const results = [];
  const baseDir = path.resolve(__dirname, 'audit-screenshots');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // 1. Audit Public Routes
  for (const route of publicRoutes) {
    const routeDir = path.join(baseDir, route.name);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    console.log(`Auditing Public Route: ${route.name} (${route.path})`);
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp, height: 900 });
      try {
        await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (e) {
        console.warn(`Nav warning for ${route.name} at ${vp}px:`, e.message);
      }
      await page.waitForTimeout(400);

      const metrics = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth + 1;

        const overflowingElements = [];
        const allElements = Array.from(document.body.querySelectorAll('*'));
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > innerWidth + 2) {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
            if (overflowingElements.length >= 5) break;
          }
        }

        const smallTouchTargets = [];
        const interactives = Array.from(document.body.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
        for (const el of interactives) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
            if (rect.width < 43 || rect.height < 43) {
              const isInlineTextLink = el.tagName === 'A' && el.parentElement && window.getComputedStyle(el.parentElement).display.includes('inline');
              if (!isInlineTextLink) {
                smallTouchTargets.push({
                  tag: el.tagName.toLowerCase(),
                  text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
                  className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                });
                if (smallTouchTargets.length >= 5) break;
              }
            }
          }
        }

        return {
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow,
          overflowingElements,
          smallTouchTargets,
        };
      });

      let hamburgerWorks = null;
      if (vp < 768) {
        try {
          const hamburger = page.locator('button[aria-controls="mobile-navigation-drawer"], button[aria-controls="mobile-admin-drawer"], button[aria-label*="navigation"]').first();
          if (await hamburger.isVisible({ timeout: 1000 })) {
            await hamburger.click();
            await page.waitForTimeout(300);
            const drawer = page.locator('#mobile-navigation-drawer, #mobile-admin-drawer').first();
            const isOpen = await drawer.isVisible();
            await hamburger.click();
            await page.waitForTimeout(200);
            hamburgerWorks = isOpen;
          }
        } catch (e) {
          hamburgerWorks = false;
        }
      }

      const screenshotPath = path.join(routeDir, `${vp}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const passed = !metrics.hasHorizontalOverflow && (vp >= 768 || hamburgerWorks !== false);

      results.push({
        route: route.name,
        path: route.path,
        viewport: vp,
        status: passed ? 'PASS' : 'FAIL',
        hasHorizontalOverflow: metrics.hasHorizontalOverflow,
        scrollWidth: metrics.scrollWidth,
        innerWidth: metrics.innerWidth,
        overflowingElements: metrics.overflowingElements,
        smallTouchTargetsCount: metrics.smallTouchTargets.length,
        smallTouchTargets: metrics.smallTouchTargets,
        hamburgerWorks,
        screenshot: `audit-screenshots/${route.name}/${vp}px.png`,
      });
    }
  }

  // 2. Perform Login for Authenticated Routes
  console.log('Logging in as Admin for authenticated route testing...');
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/auth');
  await page.waitForTimeout(500);

  try {
    const emailInput = page.locator('input[type="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible({ timeout: 2000 })) {
      await emailInput.fill('architecturenextin@gmail.com');
      await passInput.fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(2000);
    }
  } catch (e) {
    console.error('Login attempt error:', e.message);
  }

  // 3. Audit Authenticated Routes
  for (const route of authRoutes) {
    const routeDir = path.join(baseDir, route.name);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    console.log(`Auditing Authenticated Route: ${route.name} (${route.path})`);
    for (const vp of viewports) {
      await page.setViewportSize({ width: vp, height: 900 });
      try {
        await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'domcontentloaded', timeout: 10000 });
      } catch (e) {
        console.warn(`Nav warning for ${route.name} at ${vp}px:`, e.message);
      }
      await page.waitForTimeout(400);

      const metrics = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth + 1;

        const overflowingElements = [];
        const allElements = Array.from(document.body.querySelectorAll('*'));
        for (const el of allElements) {
          const rect = el.getBoundingClientRect();
          if (rect.width > 0 && rect.right > innerWidth + 2) {
            overflowingElements.push({
              tag: el.tagName.toLowerCase(),
              className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 80) : '',
              right: Math.round(rect.right),
              width: Math.round(rect.width),
            });
            if (overflowingElements.length >= 5) break;
          }
        }

        const smallTouchTargets = [];
        const interactives = Array.from(document.body.querySelectorAll('button, a, input, select, textarea, [role="button"]'));
        for (const el of interactives) {
          const rect = el.getBoundingClientRect();
          const style = window.getComputedStyle(el);
          if (style.display !== 'none' && style.visibility !== 'hidden' && rect.width > 0 && rect.height > 0) {
            if (rect.width < 43 || rect.height < 43) {
              const isInlineTextLink = el.tagName === 'A' && el.parentElement && window.getComputedStyle(el.parentElement).display.includes('inline');
              if (!isInlineTextLink) {
                smallTouchTargets.push({
                  tag: el.tagName.toLowerCase(),
                  text: (el.innerText || el.getAttribute('aria-label') || '').slice(0, 30).trim(),
                  className: (el.className && typeof el.className === 'string') ? el.className.slice(0, 60) : '',
                  width: Math.round(rect.width),
                  height: Math.round(rect.height),
                });
                if (smallTouchTargets.length >= 5) break;
              }
            }
          }
        }

        return {
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow,
          overflowingElements,
          smallTouchTargets,
        };
      });

      let hamburgerWorks = null;
      if (vp < 768) {
        try {
          const hamburger = page.locator('button[aria-controls="mobile-navigation-drawer"], button[aria-controls="mobile-admin-drawer"], button[aria-label*="navigation"]').first();
          if (await hamburger.isVisible({ timeout: 1000 })) {
            await hamburger.click();
            await page.waitForTimeout(300);
            const drawer = page.locator('#mobile-navigation-drawer, #mobile-admin-drawer').first();
            const isOpen = await drawer.isVisible();
            await hamburger.click();
            await page.waitForTimeout(200);
            hamburgerWorks = isOpen;
          }
        } catch (e) {
          hamburgerWorks = false;
        }
      }

      const screenshotPath = path.join(routeDir, `${vp}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      const passed = !metrics.hasHorizontalOverflow && (vp >= 768 || hamburgerWorks !== false);

      results.push({
        route: route.name,
        path: route.path,
        viewport: vp,
        status: passed ? 'PASS' : 'FAIL',
        hasHorizontalOverflow: metrics.hasHorizontalOverflow,
        scrollWidth: metrics.scrollWidth,
        innerWidth: metrics.innerWidth,
        overflowingElements: metrics.overflowingElements,
        smallTouchTargetsCount: metrics.smallTouchTargets.length,
        smallTouchTargets: metrics.smallTouchTargets,
        hamburgerWorks,
        screenshot: `audit-screenshots/${route.name}/${vp}px.png`,
      });
    }
  }

  const outputPath = path.join(baseDir, 'audit-results.json');
  fs.writeFileSync(outputPath, JSON.stringify(results, null, 2));
  console.log(`Audit Complete! Saved ${results.length} test results to ${outputPath}`);
  await browser.close();
}

run().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
