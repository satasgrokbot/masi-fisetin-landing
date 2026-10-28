import {chromium} from 'playwright';
import fs from 'node:fs/promises';
import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';
const live=JSON.parse(await fs.readFile('audit/source/reviews-live.json','utf8'));
const browser=await chromium.launch({headless:true});const report={};
try{
 const page=await browser.newPage({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto(base+'/?utm_campaign=header_test',{waitUntil:'networkidle'});
 if(await page.locator('[data-consent=reject]').isVisible())await page.locator('[data-consent=reject]').click();
 assert.equal(await page.locator('.ms-account,#landing-currency,.r60-formulas,.r51-foryou,.r60-quiz,.ms-shop-panel').count(),0);
 assert.equal(await page.locator('.landing-market').innerText(),'USD');
 assert.equal(await page.locator('.landing-market img').getAttribute('alt'),'United States');
 assert.equal(await page.locator('[data-ms-promo-copy]').innerText(),'SAVE UP TO 10% + GET $160 IN GIFTS');
 report.usdHeader=true;report.removedSections=true;
 report.navigation=[];
 for(const [selector,target] of [['.landing-shop','#purchase'],['.ms-primary a:first-child','#r51-science-title'],['.ms-primary a:last-child','#r58-lab'],['#cart-icon-bubble','#purchase']]){
  await page.evaluate(()=>scrollTo(0,0));await page.locator(selector).click();await page.waitForTimeout(100);
  assert.equal(new URL(page.url()).hash,target);assert.equal(new URL(page.url()).searchParams.get('utm_campaign'),'header_test');
  const top=await page.locator(target).evaluate(n=>n.getBoundingClientRect().top);
  assert(top>=0&&top<400,`${selector}: target at ${top}`);
  report.navigation.push({selector,target,top,staysOnLanding:true});
 }
 report.filters=[];
 for(const [key,data] of Object.entries(live.filters)){
  await page.locator(`[data-review-filter="${key}"]`).click();
  const expected=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('.funnel-review-item')].map(n=>({id:n.dataset.reviewId,text:n.textContent.replace(/\s+/g,' ').trim()}));},data.grid);
  const actual=await page.locator('.funnel-review-item').evaluateAll(ns=>ns.map(n=>({id:n.dataset.reviewId,text:n.textContent.replace(/\s+/g,' ').trim()})));
  assert.deepEqual(actual,expected);
  assert.equal(await page.locator('#review-filter-status').textContent(),data.status);
  const more=page.locator('.review-read-more');for(let i=0;i<await more.count();i++)await more.nth(i).click();
  const expanded=await page.evaluate(html=>{const d=new DOMParser().parseFromString(html,'text/html');return [...d.querySelectorAll('.funnel-review-body')].map(n=>n.textContent);},data.expanded);
  assert.deepEqual(await page.locator('.funnel-review-body').allTextContents(),expanded);
  report.filters.push({key,liveQuotesMatch:true,expandedQuotesMatch:true,count:actual.length});
 }
 await page.locator('[data-review-filter=all]').click();
 await page.locator('#reviews').screenshot({path:'audit/screenshots/USD-desktop-reviews.png'});
 await page.locator('#review-video-toggle').click();
 await page.waitForFunction(()=>document.getElementById('review-video').currentTime>0.3,{timeout:25000});
 await page.locator('#review-video-toggle').click();assert(await page.locator('#review-video').evaluate(n=>n.paused));report.videoPlayAndPause=true;
 for(const width of [390,320]){
  await page.setViewportSize({width,height:844});await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(100);
  assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),`overflow at ${width}`);
  for(const sel of ['.landing-shop','.ms-primary a:first-child','.ms-primary a:last-child','.landing-market','#cart-icon-bubble'])assert(await page.locator(sel).isVisible());
 }
 await page.setViewportSize({width:390,height:844});await page.locator('#reviews').screenshot({path:'audit/screenshots/USD-phone-reviews.png'});
 report.mobileHeader=true;report.errors=errors;assert.equal(errors.length,0);
}finally{await fs.writeFile('audit/revision-tests.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report));await browser.close()}
