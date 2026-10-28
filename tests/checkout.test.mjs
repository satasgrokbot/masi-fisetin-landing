import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { attribution, cartInput, oneTimeUrl, verifyCart } from '../public/checkout.js';
const configs = ['USD'].map(currency => JSON.parse(fs.readFileSync(new URL(`../source/${currency}-catalog.json`,import.meta.url))));
function response(config,key) {
 const p=config.plans[key];
 const line=q=>({quantity:q,merchandise:{id:`gid://shopify/ProductVariant/${config.variant}`},sellingPlanAllocation:{sellingPlan:{id:`gid://shopify/SellingPlan/${p.id}`,name:`${key}-DAY SUPPLY`}},cost:{totalAmount:{amount:(p.unit*q/100).toFixed(2),currencyCode:config.currency}}});
 return {checkoutUrl:'https://masi.eu/checkouts/cn/fixture',cost:{subtotalAmount:{amount:(p.unit*p.qty/100).toFixed(2),currencyCode:config.currency}},lines:{nodes:[...(p.qty===3?[line(2),line(1)]:[line(1)]),...config.gifts.map(g=>({quantity:1,merchandise:{id:`gid://shopify/ProductVariant/${g.id}`},sellingPlanAllocation:null,cost:{totalAmount:{amount:'0.0',currencyCode:config.currency}}}))]}};
}
for(const config of configs) {
 for(const key of ['90','30']) test(`${config.currency} ${key} days preserves quantity, plan, gifts, and UTM`,()=>{
  const input=cartInput(config,key,'?utm_source=meta&utm_campaign=fall%20campaign&utm_content=one%26two&unrelated=omit');
  assert.equal(input.lines[0].quantity,config.plans[key].qty);
  assert.equal(input.lines[0].sellingPlanId,`gid://shopify/SellingPlan/${config.plans[key].id}`);
  assert.equal(input.buyerIdentity.countryCode,config.currency==='EUR'?'ES':'US');
  assert.equal(input.lines.length,4);
  assert(input.attributes.some(a=>a.key==='utm_content'&&a.value==='one&two'));
  assert.equal(verifyCart(response(config,key),config,key).hostname,'masi.eu');
 });
 test(`${config.currency} one-time uses the market permalink with UTMs`,()=>{
  const u=new URL(oneTimeUrl(config,'?utm_source=meta&utm_term=cell%20care'));
  assert.equal(u.hostname,'masi.eu');assert.equal(u.pathname,`${config.currency==='USD'?'/en-usd':''}/cart/${config.variant}:1`);
  assert.equal(u.searchParams.get('utm_term'),'cell care');assert.equal(u.searchParams.get('attributes[utm_source]'),'meta');
  assert(!u.searchParams.has('selling_plan'));assert(!u.searchParams.has('checkout'));
 });
 for (const change of ['plan','quantity','price','currency','gift','extra','host']) test(`${config.currency} blocks an incorrect ${change}`,()=>{
  const cart=response(config,'90');const n=cart.lines.nodes[0];
  if(change==='plan')n.sellingPlanAllocation=null;
  if(change==='quantity')n.quantity=6;
  if(change==='price')n.cost.totalAmount.amount='999';
  if(change==='currency')cart.cost.subtotalAmount.currencyCode='GBP';
  if(change==='gift')cart.lines.nodes.at(-1).cost.totalAmount.amount='89';
  if(change==='extra')cart.lines.nodes.push({...n,merchandise:{id:'gid://shopify/ProductVariant/123'}});
  if(change==='host')cart.checkoutUrl='https://example.com/checkout';
  assert.throws(()=>verifyCart(cart,config,'90'));
 });
}
test('attribution accepts UTM fields and excludes arbitrary query fields',()=>assert.deepEqual(attribution('?utm_source=a&redirect=https://evil.test&currency=USD'),[['utm_source','a']]));

test('90-day checkout blocks a one-time Fisetin line in the split order',()=>{
 const config=configs[0];const cart=response(config,'90');
 cart.lines.nodes[1].sellingPlanAllocation=null;
 assert.throws(()=>verifyCart(cart,config,'90'));
});

test('90-day checkout accepts the current single row with three subscription jars',()=>{
 const config=configs[0];const cart=response(config,'90');
 const product=cart.lines.nodes[0];
 product.quantity=3;
 product.cost.totalAmount.amount=(config.plans['90'].unit*3/100).toFixed(2);
 cart.lines.nodes.splice(1,1);
 assert.equal(verifyCart(cart,config,'90').hostname,'masi.eu');
});
