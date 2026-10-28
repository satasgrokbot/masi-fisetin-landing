import fs from 'node:fs/promises';import {cartInput,CART_QUERY} from '../public/checkout.js';
const config=JSON.parse(await fs.readFile('source/USD-catalog.json','utf8'));
const query=CART_QUERY.replace('quantity\n        merchandise','quantity\n        discountAllocations { discountedAmount {amount currencyCode} ... on CartAutomaticDiscountAllocation {title} }\n        merchandise');
await fs.writeFile('/tmp/fisetin-cart-inspect.graphql',query);
const results=[];
for(const name of ['current','gifts-first','without-gift-attributes']){
 const input=cartInput(config,'90','');
 if(name==='gifts-first')input.lines.reverse();
 if(name==='without-gift-attributes')input.lines.forEach(l=>delete l.attributes);
 const response=await fetch('https://masi.eu/api/2026-10/graphql.json',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({query,variables:{input}})});
 const body=await response.json();const cart=body.data?.cartCreate?.cart;
 if(!cart)throw new Error(JSON.stringify(body.errors||body.data?.cartCreate?.userErrors));
 delete cart.checkoutUrl;results.push({name,...cart});
}
await fs.writeFile('audit/gift-split-variants.json',JSON.stringify(results,null,2));
console.log(JSON.stringify(results.map(r=>({name:r.name,subtotal:r.cost.subtotalAmount,lines:r.lines.nodes.map(l=>({qty:l.quantity,id:l.merchandise.id,plan:l.sellingPlanAllocation?.sellingPlan.id,amount:l.cost.totalAmount.amount,discount:l.discountAllocations}))})),null,2));
