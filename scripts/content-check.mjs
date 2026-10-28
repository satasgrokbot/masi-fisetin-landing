import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';const browser=await chromium.launch({headless:true});const report={};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[],tracking=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(/facebook.com\/tr|googletagmanager|google-analytics/.test(r.url()))tracking.push(r.url())});
 await page.goto(base,{waitUntil:'networkidle'});
 assert.equal(await page.locator('[data-ms-promo-copy]').innerText(),'SAVE UP TO 10% + GET $160 IN GIFTS');
 assert.equal(await page.locator('.landing-shop').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(246, 255, 72)');
 assert.equal(await page.locator('.landing-shop').evaluate(n=>getComputedStyle(n).color),'rgb(43, 50, 13)');
 assert(!(await page.locator('#cookie-banner').isVisible()));assert.equal(tracking.length,0);report.noPrivacyPopup=true;report.noTrackingWithoutConsent=true;
 report.tabs={};
 for(const id of ['about-product','supply-details','benefits','references','lab-results']){
  await page.locator(`#${id} summary`).click();assert(await page.locator('#'+id).evaluate(n=>n.open));
  const text=await page.locator('#'+id).innerText();
  report.tabs[id]={words:text.trim().split(/\s+/).length,links:await page.locator('#'+id+' a[href]').count()};
  if(id==='lab-results')assert.equal(report.tabs[id].links,2);else assert(report.tabs[id].words>80,`${id} lacks detail`);
 }
 assert.equal(await page.locator('#references .landing-reference-list li').count(),8);
 assert.equal(await page.locator('#ingredient-studies .landing-study-links li').count(),6);
 assert((await page.locator('#references').innerText()).includes('10.3389/fphar.2022.927898'));
 await page.locator('#product-details').screenshot({path:'audit/screenshots/USD-details-open.png'});
 const quote="“I'm convinced that MASI supplements enhance cellular health and address several aging-related issues. It's a key component of my overall longevity strategy. This strategy includes MASI, regular exercise and a balanced diet, all working together to support a vibrant and healthy life in the years to come.”";
 assert.equal((await page.locator('.r51-expert blockquote p').innerText()).replace(/\s+/g,' ').trim(),quote);
 report.fullQuote=true;
 for(const item of await page.locator('.r60-process-step').all()){
  const details=item.locator('summary');if(await details.count())await details.click();
  const text=await item.locator('.r51-rich').innerText();assert(text.split(/\s+/).length>40);
 }
 report.processSteps=6;
 await page.locator('.r51-expert').screenshot({path:'audit/screenshots/USD-full-quote.png'});
 await page.locator('#cookie-open').click();assert(await page.locator('#cookie-banner').isVisible());assert.equal(await page.locator('#cookie-banner').evaluate(n=>getComputedStyle(n).position),'static');await page.locator('[data-consent=reject]').click();report.inlinePreferences=true;
 await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:'audit/screenshots/USD-phone-header.png'});
 assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));assert.equal(await page.locator('.landing-shop').evaluate(n=>getComputedStyle(n).backgroundColor),'rgb(246, 255, 72)');report.phoneHeader=true;
 assert.equal(errors.length,0);report.errors=errors;
}finally{await fs.writeFile('audit/content-restoration-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close()}
