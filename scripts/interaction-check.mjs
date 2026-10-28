import {chromium} from 'playwright';import fs from 'node:fs/promises';import assert from 'node:assert/strict';
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';const b=await chromium.launch({headless:true});const results={};
try{
 const c=await b.newContext({viewport:{width:390,height:844},reducedMotion:'reduce',userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'});const p=await c.newPage();const meta=[],ga=[],errors=[];
 p.on('pageerror',e=>errors.push(e.message));
 p.on('request',r=>{const u=new URL(r.url());if(u.hostname==='www.facebook.com'&&u.pathname==='/tr/')meta.push({event:u.searchParams.get('ev'),pixel:u.searchParams.get('id'),currency:u.searchParams.get('cd[currency]'),value:u.searchParams.get('cd[value]'),catalog:u.searchParams.has('cd[content_ids]')||u.searchParams.has('cd[content_type]')});if(u.hostname.endsWith('google-analytics.com')&&u.pathname.includes('collect')){const payload=new URLSearchParams(r.postData()||u.search);ga.push({id:u.searchParams.get('tid')||payload.get('tid'),event:u.searchParams.get('en')||payload.get('en')});}});
 await p.goto(base+'/?utm_source=meta&utm_campaign=fisetin_preview',{waitUntil:'networkidle'});assert.equal(meta.length,0);assert.equal(ga.length,0);results.noTrackingBeforeConsent=true;
 await p.locator('#cookie-open').click();await p.locator('[data-consent=accept]').click();await p.waitForTimeout(3500);
 for(const ev of ['PageView','ViewContent'])assert(meta.some(e=>e.event===ev),`Missing Meta ${ev}`);
 assert(meta.every(e=>e.pixel==='1459202204862031'&&!e.catalog));
 await p.locator('#gallery-next').click();assert.equal(await p.locator('#gallery-count').textContent(),'2 / 7');await p.locator('#gallery-enlarge').click();assert(await p.locator('#gallery-dialog').evaluate(n=>n.open));await p.locator('#gallery-close').click();
 await p.locator('[data-open=benefits]').click();assert(await p.locator('#info-dialog').evaluate(n=>n.open));assert(!(await p.locator('#info-dialog-content').innerText()).match(/cancer|energy/i));await p.locator('#info-dialog-back').click();
 await p.locator('#details-toggle').click();assert(await p.locator('#about-product').evaluate(n=>n.open));await p.locator('#details-toggle').click();
 await p.locator('.r51-faq-item summary').first().click();assert(await p.locator('.r51-faq-item').first().evaluate(n=>n.open));
 await p.locator('label[for=subscribe]').click();assert(await p.locator('#subscribe-card .cta').isVisible());assert(await p.locator('#subscribe-body .gift-preview').isVisible());assert(!(await p.locator('#m3-body').isVisible()));
 await p.locator('label[for=one-time]').click();assert(await p.locator('#one-time-card .cta').isVisible());assert(!(await p.locator('#subscribe-body').isVisible()));
 await p.locator('label[for=three-month]').click();
 await p.locator('#r51-science-title').scrollIntoViewIfNeeded();await p.waitForTimeout(200);assert(await p.locator('#sticky-cta').isVisible());
 await p.locator('#sticky-cta').click();await p.waitForURL(/masi\.eu\/checkouts\//,{timeout:45000});await p.waitForTimeout(500);
 assert(meta.some(e=>e.event==='InitiateCheckout'));results.meta=meta;results.ga=ga;results.galleryAndZoom=true;results.detailsAndFaq=true;results.planSwitching=true;results.stickyCheckout=true;results.errors=errors;
 await c.close();
 const c2=await b.newContext({viewport:{width:390,height:844}});const p2=await c2.newPage();await p2.goto(base+'/?utm_source=meta&utm_campaign=currency_test');if(await p2.locator('[data-consent=reject]').isVisible())await p2.locator('[data-consent=reject]').click();assert.equal(await p2.locator('#landing-currency').count(),0);assert((await p2.locator('#three-month-card').innerText()).includes('$170.97'));results.usdOnly=true;
 await p2.locator('#cookie-open').click();await p2.locator('[data-consent=accept]').click();await p2.waitForTimeout(500);await p2.locator('#cookie-open').click();if(await p2.locator('[data-consent=reject]').isVisible())await p2.locator('[data-consent=reject]').click();await p2.waitForLoadState('domcontentloaded');await p2.waitForTimeout(300);assert.equal(await p2.evaluate(()=>JSON.parse(localStorage.getItem('masi-fisetin-consent')).marketing),false);results.consentRevocation=true;await c2.close();
}finally{await fs.writeFile('audit/interaction-tests.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results));await b.close()}
