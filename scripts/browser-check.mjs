import fs from 'node:fs/promises';import path from 'node:path';import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH||'playwright');
const base=process.env.PREVIEW_URL||'http://127.0.0.1:4173';
const browser=await chromium.launch({headless:true});
const report=[];
try{
 for(const currency of ['USD']){
  for(const key of ['90','30','once']){
   const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});const page=await context.newPage();
   const errors=[];const failed=[];const graphql=[];const requests=[];
   page.on('pageerror',e=>errors.push(e.message));
   page.on('requestfailed',r=>{if(r.url().startsWith(base))failed.push(r.url().replace(base,''))});
   page.on('request',r=>{if(/facebook\.com\/tr|google-analytics\.com\/g\/collect|googletagmanager\.com/.test(r.url()))requests.push(r.url())});
   page.on('response',async r=>{if(r.url().includes('/api/2026-10/graphql.json')){const j=await r.json();const c=j.data?.cartCreate?.cart;if(c){delete c.checkoutUrl;graphql.push(c)}else graphql.push({errors:j.errors||j.data?.cartCreate?.userErrors});}});
   await page.goto(base+'/'+'?utm_source=meta&utm_campaign=fisetin_preview&utm_content=checkout_test',{waitUntil:'networkidle'});
   const config=await page.locator('#landing-data').evaluate(n=>JSON.parse(n.textContent));
   const cleanBeforeConsent=requests.length===0;
   if(key==='90'){
    await fs.mkdir(root+'/audit/screenshots',{recursive:true});
    await page.screenshot({path:root+`/audit/screenshots/${currency}-desktop-consent.png`});
    if(await page.locator('[data-consent=reject]').isVisible())await page.locator('[data-consent=reject]').click();
    for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=1000){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(30);}
    await page.evaluate(()=>scrollTo(0,0));await page.waitForTimeout(200);
    await page.screenshot({path:root+`/audit/screenshots/${currency}-desktop.png`,fullPage:true});
    await page.screenshot({path:root+`/audit/screenshots/${currency}-desktop-top.png`});
    await page.setViewportSize({width:390,height:844});await page.waitForTimeout(200);
    await page.screenshot({path:root+`/audit/screenshots/${currency}-phone.png`,fullPage:true});
    await page.screenshot({path:root+`/audit/screenshots/${currency}-phone-top.png`});
   }else if(await page.locator('[data-consent=reject]').isVisible())await page.locator('[data-consent=reject]').click();
   const overflow=await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth);
   if(key!=='90')await page.locator(key==='30'?'label[for=subscribe]':'label[for=one-time]').click();
   const card=key==='90'?'#three-month-card':key==='30'?'#subscribe-card':'#one-time-card';
   const shown=await page.locator(card).innerText();
   await page.locator(`${card} .cta`).click();
   try{await page.waitForURL(/masi\.eu\/checkouts\//,{timeout:45000});await page.waitForTimeout(1800);await page.setViewportSize({width:1440,height:1000});await page.waitForTimeout(400);}catch{
    const error=await page.locator('#purchase-error').textContent({timeout:1000}).catch(()=>null);console.log('CHECKOUT FAILED',new URL(page.url()).pathname);report.push({currency,key,errors,failed,overflow,cleanBeforeConsent,checkout:false,error,graphql});console.log(JSON.stringify(report.at(-1)));await context.close();continue;
   }
   const text=await page.locator('body').innerText();
   const expected=config.plans[key];
   const money=new Intl.NumberFormat('en-US',{style:'currency',currency}).format(expected.unit*expected.qty/100);
   const item={currency,key,expected:{variant:config.variant,quantity:expected.qty,plan:expected.id,total:money},errors,failed,overflow,cleanBeforeConsent,checkout:true,containsProduct:text.includes('Premium FISETIN'),containsPrice:text.includes(money),containsPlan:expected.id?text.includes(`${key}-DAY SUPPLY`):!text.includes('DAY SUPPLY'),freeGiftCount:(text.match(/\bFREE\b/g)||[]).length,graphql,shown};
   await page.screenshot({path:root+`/audit/screenshots/checkout-${currency}-${key}.png`,fullPage:true});
   await fs.mkdir(root+'/audit/browser-raw',{recursive:true});await fs.writeFile(root+`/audit/browser-raw/checkout-${currency}-${key}.txt`,text);
   report.push(item);console.log(JSON.stringify({...item,shown:undefined,graphql:undefined}));await context.close();
  }
 }
}finally{await fs.writeFile(root+'/audit/checkout-tests.json',JSON.stringify(report,null,2));await browser.close()}
