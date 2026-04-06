const { chromium } = require('playwright'); // if playwright is installed

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
  page.on('pageerror', err => console.log('BROWSER ERROR:', err.message));
  
  await page.goto('http://localhost:8000');
  await page.waitForTimeout(2000); // let things load
  
  // click at screen center where things might be?
  await page.mouse.click(500, 500);
  
  await page.waitForTimeout(1000);
  
  const elementClass = await page.evaluate(() => {
    return document.getElementById('planet-info').className;
  });
  console.log('CLASS AFTER CLICK:', elementClass);

  await browser.close();
})();
