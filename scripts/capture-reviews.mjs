import {chromium} from 'playwright';
import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1440,height:1000}});
await page.goto('https://masi.eu/en-usd/products/fisetin',{waitUntil:'domcontentloaded'});
await page.waitForSelector('.funnel-review-item');
await page.waitForTimeout(2500);
const result={capturedAt:new Date().toISOString(),url:page.url(),header:await page.locator('.masi-header-section').evaluate(n=>n.outerHTML),reviews:await page.evaluate(()=>window.MASI_REVIEWS),html:await page.locator('#reviews').evaluate(n=>n.outerHTML),scripts:await page.locator('script[src]').evaluateAll(ns=>ns.map(n=>n.src)),filters:{}};
const filters=await page.locator('[data-review-filter]').evaluateAll(ns=>ns.map(n=>({key:n.dataset.reviewFilter,text:n.textContent.trim()})));
for(const filter of filters){
 await page.locator(`[data-review-filter="${filter.key}"]`).click();await page.waitForTimeout(250);
 result.filters[filter.key]={label:filter.text,grid:await page.locator('#funnel-review-grid').evaluate(n=>n.outerHTML),status:await page.locator('#review-filter-status').textContent()};
 const more=page.locator('.review-read-more');
 for(let i=0;i<await more.count();i++) await more.nth(i).click();
 result.filters[filter.key].expanded=await page.locator('#funnel-review-grid').evaluate(n=>n.outerHTML);
}
await fs.writeFile('audit/source/reviews-live.json',JSON.stringify(result,null,2));
await page.locator('[data-review-filter="all"]').click();
await page.locator('#reviews').screenshot({path:'audit/screenshots/live-reviews-desktop.png'});
console.log(JSON.stringify({filters:Object.fromEntries(Object.entries(result.filters).map(([k,v])=>[k,{status:v.status,length:v.grid.length}])),scripts:result.scripts.filter(s=>/r28|reviews|r51/.test(s))}));
await browser.close();
