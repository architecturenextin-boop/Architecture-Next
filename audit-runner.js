const fs = require('fs');
const path = require('path');

module.exports = async function runAudit(page) {
  const viewports = [320, 375, 414, 480, 640, 768, 1024, 1280, 1920];
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
  const baseDir = path.resolve(process.cwd(), 'audit-screenshots');
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  // 1. Audit Public Routes
  for (const route of publicRoutes) {
    const routeDir = path.join(baseDir, route.name);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp, height: 900 });
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(500);

      const metrics = await page.evaluate(() => {
        const scrollWidth = document.documentElement.scrollWidth;
        const innerWidth = window.innerWidth;
        const hasHorizontalOverflow = scrollWidth > innerWidth + 1;

        // Overflowing elements
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

        // Touch targets < 44x44
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

        // Small fonts < 12px
        const smallFonts = [];
        for (const el of allElements) {
          const style = window.getComputedStyle(el);
          const fontSize = parseFloat(style.fontSize);
          if (fontSize < 11.5 && el.innerText && el.innerText.trim().length > 0 && !el.children.length) {
            smallFonts.push({
              tag: el.tagName.toLowerCase(),
              text: el.innerText.slice(0, 30).trim(),
              fontSize: `${fontSize}px`,
            });
            if (smallFonts.length >= 3) break;
          }
        }

        return {
          scrollWidth,
          innerWidth,
          hasHorizontalOverflow,
          overflowingElements,
          smallTouchTargets,
          smallFonts,
        };
      });

      // Test mobile hamburger if on < 768px
      let hamburgerWorks = null;
      if (vp < 768) {
        try {
          const hamburger = page.locator('button[aria-controls="mobile-navigation-drawer"], button[aria-controls="mobile-admin-drawer"], button[aria-label*="navigation"]').first();
          if (await hamburger.isVisible()) {
            await hamburger.click();
            await page.waitForTimeout(300);
            const drawer = page.locator('#mobile-navigation-drawer, #mobile-admin-drawer').first();
            const isOpen = await drawer.isVisible();
            await hamburger.click(); // close it
            await page.waitForTimeout(200);
            hamburgerWorks = isOpen;
          }
        } catch (e) {
          hamburgerWorks = false;
        }
      }

      // Take full page screenshot
      const screenshotPath = path.join(routeDir, `${vp}px.png`);
      await page.screenshot({ path: screenshotPath, fullPage: true });

      results.push({
        route: route.name,
        path: route.path,
        viewport: vp,
        hasHorizontalOverflow: metrics.hasHorizontalOverflow,
        scrollWidth: metrics.scrollWidth,
        innerWidth: metrics.innerWidth,
        overflowingElements: metrics.overflowingElements,
        smallTouchTargetsCount: metrics.smallTouchTargets.length,
        smallTouchTargets: metrics.smallTouchTargets,
        smallFontsCount: metrics.smallFonts.length,
        smallFonts: metrics.smallFonts,
        hamburgerWorks,
        screenshot: `audit-screenshots/${route.name}/${vp}px.png`,
      });
    }
  }

  // 2. Perform Login for Authenticated Routes
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.goto('http://localhost:5173/auth');
  await page.waitForTimeout(500);

  try {
    const emailInput = page.locator('input[type="email"]').first();
    const passInput = page.locator('input[type="password"]').first();
    if (await emailInput.isVisible()) {
      await emailInput.fill('architecturenextin@gmail.com');
      await passInput.fill('Admin@123');
      await page.locator('button[type="submit"]').click();
      await page.waitForTimeout(1500);
    }
  } catch (e) {
    console.error('Login attempt error:', e);
  }

  // 3. Audit Authenticated Routes
  for (const route of authRoutes) {
    const routeDir = path.join(baseDir, route.name);
    if (!fs.existsSync(routeDir)) {
      fs.mkdirSync(routeDir, { recursive: true });
    }

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp, height: 900 });
      await page.goto(`http://localhost:5173${route.path}`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.waitForTimeout(500);

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
          if (await hamburger.isVisible()) {
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

      results.push({
        route: route.name,
        path: route.path,
        viewport: vp,
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

  fs.writeFileSync(path.join(baseDir, 'audit-results.json'), JSON.stringify(results, null, 2));
  return results;
};
