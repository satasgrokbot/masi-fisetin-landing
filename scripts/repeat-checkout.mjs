import {chromium} from 'playwright';import assert from 'node:assert/strict';import fs from 'node:fs/promises';
const browser=await chromium.launch({headless:true});const result={};
try{
 const p=await browser.newPage();const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';let created=[];
 p.on('response',async r=>{if(r.url().includes('/api/2026-10/graphql.json')){const j=await r.json();const c=j.data?.cartCreate?.cart;if(c){delete c.checkoutUrl;created.push(c);}}});
 await p.goto(base,{waitUntil:'networkidle'});if(await p.locator('[data-consent=reject]').isVisible())await p.locator('[data-consent=reject]').click();await p.locator('label[for=one-time]').click();await p.locator('#one-time-card .cta').click();await p.waitForURL(/masi\.eu\/checkouts\//,{timeout:45000});
 await p.goto(base,{waitUntil:'networkidle'});await p.locator('#three-month-card .cta').dblclick();await p.waitForURL(/masi\.eu\/checkouts\//,{timeout:45000});await p.waitForTimeout(1200);
 assert.equal(created.length,1);
 const lines=created[0].lines.nodes.filter(l=>l.merchandise.id.endsWith('/45882827014419'));
 assert.equal(lines.reduce((q,l)=>q+l.quantity,0),3);
 assert(lines.every(l=>l.sellingPlanAllocation?.sellingPlan.id.endsWith('/692433813779')));
 assert.equal(created[0].cost.subtotalAmount.amount,'512.91');
 const body=await p.locator('body').innerText();assert(body.includes('$512.91 every 12 weeks'));
 result.existingOneTimeCartNotAppended=true;result.doubleClickCreatesOneCart=true;result.productLines=lines;result.subtotal=created[0].cost.subtotalAmount;result.recurring='$512.91 every 12 weeks';
}finally{await fs.writeFile('audit/repeat-checkout.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));await browser.close()}
