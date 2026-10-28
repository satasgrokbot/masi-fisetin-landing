import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
for(const file of ['index.html','usd/index.html'])test(`${file} has restricted copy outside the explicitly restored live reviews and no catalog runtime`,()=>{
 const html=fs.readFileSync(new URL('../public/'+file,import.meta.url),'utf8');
 const copy=html.replace(/<section[^>]*id="reviews"[\s\S]*?<\/section>/i,'').replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ');
 assert.doesNotMatch(copy,/\b(cancer|tumou?r|metastasis|diabetes|dementia|alzheimer\w*|parkinson\w*|allergies|weight loss|fat|ozempic|GLP-1|prevent\w*|treat\w*|cure\w*|energy)\b|inflammation cure/i);
 assert.doesNotMatch(html,/<script[^>]+src=["'][^"']*(shopify|masi\.eu|recharge)/i);
 assert.doesNotMatch(html,/application\/ld\+json|og:product|product:price|fb:app_id/);
 assert.doesNotMatch(copy,/no fillers|2 adults|two adults|Reverses Skin Aging/i);
 assert.doesNotMatch(copy,/€|\bEUR\b|Compare the five formulas|Fisetin for your healthy-aging routine/);
 assert.doesNotMatch(html,/id="landing-currency"|class="ms-account"|class="r60-quiz/);
 assert.match(html,/250 mg of pure Fisetin/);assert.match(html,/60 vegan capsules per jar/);
 assert.match(html,/noindex,nofollow/);assert.match(html,/policies\/privacy-policy/);
});

test('both routes contain only the US catalog and header anchors',()=>{
 const root=fs.readFileSync(new URL('../public/index.html',import.meta.url),'utf8');
 assert.equal(root,fs.readFileSync(new URL('../public/usd/index.html',import.meta.url),'utf8'));
 assert.match(root,/href="#r58-lab">Lab results/);
 assert.match(root,/href="#r51-science-title">Science/);
 assert.match(root,/"currency":"USD","country":"US"/);
 assert.match(root,/SAVE UP TO 10% \+ GET \$160 IN GIFTS/);
 assert.match(root,/class="landing-market ms-market"/);
 assert.match(root,/<script src="\/masi-header.js"><\/script><script src="\/app.js"/);
 assert.doesNotMatch(root,/<summary>[^<]*<span aria-hidden="true">\+<\/span>/);
});
