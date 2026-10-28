import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const {chromium}=await import(process.env.PLAYWRIGHT_MODULE_PATH || 'playwright');
const browser=await chromium.launch({headless:true});
try {
 for(const [currency,prefix] of [['EUR',''],['USD','/en-usd']]) {
  const context=await browser.newContext({viewport:{width:1440,height:1000},reducedMotion:'reduce'});
  const page=await context.newPage();const tracking=[];
  page.on('request',request=>{if(/facebook\.com\/tr|googletagmanager\.com|google-analytics\.com/.test(request.url()))tracking.push(request.url());});
  const response=await page.goto(`https://masi.eu${prefix}/products/fisetin`,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.MasiCart?.config && document.querySelector('#m3-body .gift-preview'));
  await fs.writeFile(`${root}/audit/source/${currency}-response.html`,await response.text());
  for(let y=0;y<await page.evaluate(()=>document.body.scrollHeight);y+=900){await page.evaluate(y=>scrollTo(0,y),y);await page.waitForTimeout(65);}
  await page.waitForTimeout(1200);await page.evaluate(()=>scrollTo(0,0));
  const data=await page.evaluate(()=>({
   title:document.title,lang:document.documentElement.lang,url:location.href,
   styles:[...document.querySelectorAll('link[rel="stylesheet"]')].map(n=>n.href),inlineStyles:[...document.querySelectorAll('style')].map(n=>n.textContent),
   body:document.body.innerHTML,text:document.body.innerText,
   main:document.querySelector('#MainContent')?.outerHTML,header:document.querySelector('masi-site-header')?.outerHTML,
   bodyClass:document.body.className,bodyId:document.body.id,
   config:window.MasiCart.config,product:window.MASI_PRODUCT,plan:JSON.parse(document.querySelector('[data-masi-3m-data]').textContent),
   dialogs:[...document.querySelectorAll('[role="dialog"],dialog,[class*="cookie"],[id*="cookie"]')].map(n=>({tag:n.tagName,id:n.id,class:n.className,text:n.innerText?.slice(0,1600),html:n.outerHTML})),
   images:[...document.querySelectorAll('#masi-pdp img')].map(n=>({src:n.currentSrc||n.src,alt:n.alt,width:n.width,height:n.height})),
   headings:[...document.querySelectorAll('#masi-pdp h1,#masi-pdp h2,#masi-pdp h3')].map(n=>({tag:n.tagName,id:n.id,text:n.innerText})),
   scripts:[...document.querySelectorAll('script[src]')].map(n=>n.src)
  }));
  data.tracking=tracking;data.capturedAt=new Date().toISOString();
  data.productJson=await (await context.request.get(`https://masi.eu${prefix}/products/fisetin.js`)).json();
  await fs.writeFile(`${root}/audit/source/${currency}.json`,JSON.stringify(data,null,2));
  await page.screenshot({path:`${root}/audit/source/${currency}-desktop.png`,fullPage:true});
  await page.setViewportSize({width:390,height:844});await page.evaluate(()=>scrollTo(0,0));await page.screenshot({path:`${root}/audit/source/${currency}-phone.png`,fullPage:true});
  console.log(JSON.stringify({currency,actual:data.config.currency,product:data.productJson.id,headings:data.headings,styles:data.styles,dialogs:data.dialogs.map(({html,...rest})=>rest),tracking}));
  await context.close();
 }
} finally {await browser.close();}
