import { chromium } from 'playwright';

async function testMobileResponsiveness() {
  console.log('🚀 Launching Playwright to test Learn Page Mobile Responsiveness...');
  const browser = await chromium.launch({ headless: true, channel: 'chrome' }).catch(() => chromium.launch({ headless: true, channel: 'msedge' }));
  const context = await browser.newContext();
  const page = await context.newPage();

  // Generate admin token
  let token = null;
  try {
    const { signToken } = await import('../backend/src/utils/jwt.js');
    const { prisma } = await import('../backend/src/config/db.js');
    const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (admin) token = signToken({ userId: admin.id });
  } catch (e) {
    console.log('Token warning:', e.message);
  }

  await page.goto('http://localhost:5173/', { waitUntil: 'domcontentloaded' });
  if (token) {
    await page.evaluate((t) => {
      localStorage.setItem('skillspring_auth_token', t);
      localStorage.setItem('auth_token', t);
      localStorage.setItem('token', t);
    }, token);
  }

  const mobileViewports = [
    { name: 'Ultra-small Mobile (320px - Galaxy Fold)', width: 320, height: 650 },
    { name: 'Small Mobile (360px - Android)', width: 360, height: 740 },
    { name: 'iPhone SE / 8 (375px)', width: 375, height: 667 },
    { name: 'iPhone 12/13/14/15 Pro (390px)', width: 390, height: 844 },
    { name: 'Samsung Galaxy S22/S23 (412px)', width: 412, height: 915 },
    { name: 'iPhone 14/15 Plus / Pro Max (428px)', width: 428, height: 926 },
    { name: 'iPad Mini (768px)', width: 768, height: 1024 },
    { name: 'Desktop Full HD (1280px)', width: 1280, height: 800 }
  ];

  console.log('\n--- Evaluating Learn Page across 8 viewports ---');
  for (const vp of mobileViewports) {
    await page.setViewportSize({ width: vp.width, height: vp.height });
    await page.goto('http://localhost:5173/learn/architecture-plan-presentation-animation?lessonId=17d26431-a9b2-4481-a96b-67a800638273', {
      waitUntil: 'networkidle',
      timeout: 15000
    }).catch(() => {});

    // Check document scrollWidth vs clientWidth
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
    const hasHorizontalOverflow = scrollWidth > clientWidth + 1;

    // Check header elements bounding boxes
    const headerInfo = await page.evaluate(() => {
      const header = document.querySelector('header');
      if (!header) return { exists: false };
      const backBtn = header.querySelector('a[href*="dashboard"]');
      const title = header.querySelector('h2');
      const modulesBtn = header.querySelector('button');
      return {
        exists: true,
        headerWidth: header.clientWidth,
        backBtnWidth: backBtn?.getBoundingClientRect().width || 0,
        titleWidth: title?.getBoundingClientRect().width || 0,
        modulesBtnWidth: modulesBtn?.getBoundingClientRect().width || 0,
      };
    });

    console.log(`\n📱 [${vp.name} (${vp.width}px)]:`);
    console.log(`   Overflow: ${hasHorizontalOverflow ? '❌ YES (' + (scrollWidth - clientWidth) + 'px)' : '✅ NONE (0px)'}`);
    console.log(`   Header Elements: BackBtn=${Math.round(headerInfo.backBtnWidth)}px, Title=${Math.round(headerInfo.titleWidth)}px, ModulesBtn=${Math.round(headerInfo.modulesBtnWidth)}px`);
  }

  await browser.close();
}

testMobileResponsiveness().catch(console.error);
