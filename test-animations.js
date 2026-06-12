const { chromium } = require('playwright');

const URL = process.argv[2] || 'https://lc-michelle-media-kit.vercel.app';

async function testAnimations() {
  console.log('🚀 Starting animation tests...\n');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 }
  });
  const page = await context.newPage();

  const errors = [];
  const checks = [];

  // Capture console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(`Console Error: ${msg.text()}`);
    }
  });

  page.on('pageerror', err => {
    errors.push(`Page Error: ${err.message}`);
  });

  try {
    console.log(`📍 Loading: ${URL}`);
    await page.goto(URL, { waitUntil: 'networkidle', timeout: 30000 });
    console.log('✅ Page loaded\n');

    // Wait for preloader to finish (max 5 seconds)
    console.log('⏳ Waiting for preloader...');
    try {
      await page.waitForFunction(() => {
        const preloader = document.getElementById('preloader');
        return !preloader || preloader.classList.contains('done') || preloader.style.display === 'none';
      }, { timeout: 5000 });
      console.log('✅ Preloader finished\n');
    } catch (e) {
      console.log('⚠️ Preloader still visible after 5s (may be normal)\n');
    }

    // Check hero animation
    console.log('🎬 Testing hero animations...');
    const heroReady = await page.evaluate(() => {
      return document.querySelector('.hero')?.classList.contains('ready');
    });
    checks.push({ name: 'Hero ready class', passed: heroReady });
    console.log(heroReady ? '✅ Hero animation triggered' : '❌ Hero animation NOT triggered');

    // Check nav visibility
    const navVisible = await page.evaluate(() => {
      const nav = document.getElementById('nav');
      const style = window.getComputedStyle(nav);
      return style.transform !== 'matrix(1, 0, 0, 1, 0, -110)';
    });
    checks.push({ name: 'Navigation visible', passed: navVisible });
    console.log(navVisible ? '✅ Navigation is visible' : '❌ Navigation NOT visible');

    // Check stats are rendered
    const statsRendered = await page.evaluate(() => {
      return document.querySelectorAll('.stat').length > 0;
    });
    checks.push({ name: 'Stats rendered', passed: statsRendered });
    console.log(statsRendered ? '✅ Stats rendered' : '❌ Stats NOT rendered');

    // Check marquee is animating
    console.log('\n🎠 Testing marquee...');
    const marqueeTransform = await page.evaluate(() => {
      const marquee = document.querySelector('[data-marquee]');
      return marquee ? window.getComputedStyle(marquee).transform : 'none';
    });
    console.log(`   Marquee transform: ${marqueeTransform}`);

    // Scroll down to test scroll-based animations
    console.log('\n📜 Testing scroll animations...');
    await page.evaluate(() => window.scrollTo(0, 500));
    await page.waitForTimeout(500);

    const progressBar = await page.evaluate(() => {
      const bar = document.getElementById('progressBar');
      return bar ? window.getComputedStyle(bar).transform : 'none';
    });
    const progressWorking = progressBar && progressBar !== 'none' && progressBar !== 'matrix(1, 0, 0, 1, 0, 0)';
    checks.push({ name: 'Scroll progress bar', passed: progressWorking });
    console.log(progressWorking ? '✅ Progress bar animating' : '❌ Progress bar NOT animating');

    // Scroll to stats section
    console.log('\n📊 Testing stats counter...');
    await page.evaluate(() => {
      document.getElementById('statistics')?.scrollIntoView();
    });
    await page.waitForTimeout(1000);

    const statsInView = await page.evaluate(() => {
      const stats = document.querySelectorAll('.stat.in');
      return stats.length > 0;
    });
    checks.push({ name: 'Stats visible on scroll', passed: statsInView });
    console.log(statsInView ? '✅ Stats visible after scroll' : '❌ Stats NOT visible after scroll');

    // Check data-fade elements
    const fadeElements = await page.evaluate(() => {
      return document.querySelectorAll('[data-fade].in').length;
    });
    checks.push({ name: 'Fade animations triggered', passed: fadeElements > 0 });
    console.log(fadeElements > 0 ? `✅ ${fadeElements} fade elements animated` : '❌ No fade animations triggered');

    // Check word animations
    const wordElements = await page.evaluate(() => {
      return document.querySelectorAll('.w > i').length;
    });
    checks.push({ name: 'Word split animations', passed: wordElements > 0 });
    console.log(wordElements > 0 ? `✅ ${wordElements} words split for animation` : '❌ Words NOT split');

    // Scroll to packages section
    console.log('\n📦 Testing packages section...');
    await page.evaluate(() => {
      document.getElementById('packages')?.scrollIntoView();
    });
    await page.waitForTimeout(500);

    const packagesVisible = await page.evaluate(() => {
      return document.querySelectorAll('.pkg[data-fade].in').length > 0;
    });
    checks.push({ name: 'Packages visible', passed: packagesVisible });
    console.log(packagesVisible ? '✅ Packages section animated' : '❌ Packages NOT animated');

    // Final check
    console.log('\n' + '='.repeat(50));
    console.log('📋 TEST RESULTS:\n');

    let allPassed = true;
    checks.forEach(check => {
      const status = check.passed ? '✅' : '❌';
      console.log(`${status} ${check.name}`);
      if (!check.passed) allPassed = false;
    });

    if (errors.length > 0) {
      console.log('\n🚨 ERRORS FOUND:\n');
      errors.forEach(err => console.log(`   ${err}`));
      allPassed = false;
    } else {
      console.log('\n✅ No JavaScript errors detected');
    }

    console.log('\n' + '='.repeat(50));

    if (allPassed) {
      console.log('\n🎉 ALL TESTS PASSED! Animations are working correctly.\n');
    } else {
      console.log('\n⚠️ SOME TESTS FAILED. See above for details.\n');
    }

  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  } finally {
    await browser.close();
  }
}

testAnimations().catch(console.error);
