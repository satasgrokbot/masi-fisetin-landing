"""Refresh the static landing from a read-only capture of the live MASI page.
Raw captures stay in the ignored audit/source directory; only sanitized output ships.
"""
import json, re, hashlib, urllib.request, urllib.parse, pathlib, concurrent.futures
from bs4 import BeautifulSoup, Comment
ROOT=pathlib.Path(__file__).resolve().parents[1]
PUBLIC=ROOT/'public'; ASSETS=PUBLIC/'assets'; ASSETS.mkdir(parents=True,exist_ok=True)
manifest={}; changes=[]
APPROVED=[
"As we age, senescent or “zombie” cells build up in the body — cells that have stopped dividing but remain active. Scientists study them as one process involved in aging.",
"Fisetin is a plant flavonol studied for how it interacts with senescent cells and for pathways linked to cellular renewal and healthy aging.",
"Each capsule contains 250 mg of pure Fisetin.",
"60 vegan capsules per jar.",
"Made in Germany with German raw materials and third-party tested in Switzerland for purity.",
"Laboratory research studies fisetin’s antioxidant activity and cellular responses to oxidative stress — areas of interest for healthy-aging science.",
"How to take: 40–50 years, 1 capsule per day; 50 years and more, 2 capsules per day."
]
def url(u,base='https://masi.eu'):
 return urllib.parse.urljoin(base,u)
def local(u):
 if u.startswith('/assets/'):return u
 u=url(u)
 if not u.startswith('https://'):return u
 if u in manifest:return manifest[u]
 parsed=urllib.parse.urlparse(u); name=pathlib.Path(parsed.path).name
 name=re.sub(r'[^a-zA-Z0-9._-]','-',name)
 target='/assets/'+hashlib.sha256(u.encode()).hexdigest()[:10]+'-'+name
 manifest[u]=target
 p=PUBLIC/target.lstrip('/')
 if not p.exists():
  req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
  with urllib.request.urlopen(req,timeout=40) as r:p.write_bytes(r.read())
 return target

def replace(s,sel,text,market,reason='Approved Fisetin copy'):
 for n in s.select(sel):
  old=n.get_text(' ',strip=True)
  n.clear();n.append(text)
  if old!=text and market=='USD':changes.append({'location':sel,'before':old,'after':text,'reason':reason})
def remove(s,sel,market,reason):
 for n in s.select(sel):
  if market=='USD':changes.append({'location':sel,'before':n.get_text(' ',strip=True) or n.get('alt') or n.get('aria-label') or n.name,'after':'Removed','reason':reason})
  n.decompose()
def html(s,sel,body,market,reason='Approved Fisetin copy'):
 for n in s.select(sel):
  old=n.get_text(' ',strip=True);n.clear();n.append(BeautifulSoup(body,'html.parser'))
  if market=='USD':changes.append({'location':sel,'before':old,'after':n.get_text(' ',strip=True),'reason':reason})

for market in ['USD']:
 d=json.loads((ROOT/'audit/source'/f'{market}.json').read_text())
 full=BeautifulSoup(d['body'],'html.parser')
 s=BeautifulSoup('<!doctype html><html lang="en"><head></head><body></body></html>','html.parser')
 s.body['id']=d['bodyId'];s.body['class']=d['bodyClass']
 for sel in ['.skip-to-content-link','.masi-header-section','#MainContent','.shopify-section-group-footer-group']:
  s.body.append(full.select_one(sel).extract())
 for n in s.find_all(string=lambda t:isinstance(t,Comment)):n.extract()
 for n in s.select('script,style,link,noscript,iframe,shopify-accelerated-checkout,shopify-payment-terms'):n.decompose()
 for n in s.find_all(True):
  for a in list(n.attrs):
   if a.startswith('on') or a.startswith('data-shopify') or a in ['itemscope','itemtype','itemprop']:del n[a]
 remove(s,'.gift-preview-legacy,.adults-control,.m30-adults,.m3-adults,#purchase-recovery,.r65-native-renewal',market,'Current live selector has one adult only; remove obsolete hidden UI')
 remove(s,'#one-time-card #ot-checklist-slot',market,'No negative-benefit list on the current one-time option')
 for n in s.select('input[type="hidden"]'):n.decompose()
 s.select_one('#purchase')['action']='https://masi.eu/cart/add'
 for n in s.select('#purchase input[type="radio"]'):n['name']='landing-plan'
 replace(s,'.product-overview',' '.join(APPROVED[:2]),market)
 replace(s,'.benefit-eyebrow','Supports healthy aging',market)
 for n,t in zip(s.select('.benefit-ticks .tick-label'),['Helps clear senescent cells','Supports antioxidant protection','Supports healthy brain aging']):
  old=n.get_text(' ',strip=True);n.string=t
  if market=='USD':changes.append({'location':'.benefit-ticks .tick-label','before':old,'after':t,'reason':'Approved Fisetin copy'})
 replace(s,'.tick-study','Read research',market,'Do not describe trial registrations or reviews as established clinical results')
 for link,href in zip(s.select('.benefit-ticks .tick-study'),['https://doi.org/10.1016/j.ebiom.2018.09.015','https://doi.org/10.15171/apb.2016.037','https://doi.org/10.1089/ars.2012.4901']):link['href']=href
 # Restore the complete information structure with sourced, neutral descriptions.
 detail=json.loads((ROOT/'source/detail-copy.json').read_text())
 for ident in ['about-product','supply-details','benefits','references']:
  n=s.select_one('#'+ident);summary=n.find('summary').extract();old=n.get_text(' ',strip=True);n.clear();n.append(summary)
  n.append(BeautifulSoup('<div class="accordion-content">'+detail[ident]+'</div>','html.parser'))
  changes.append({'location':'#'+ident,'before':old,'after':n.get_text(' ',strip=True),'reason':'Restore full product information and sourced research links; remove disease claims and distinguish study types'})
 # Raster slide 8 makes outcome claims; the NMN video is not a Fisetin testimonial.
 remove(s,'.gallery-thumb:nth-child(9),.gallery-thumb:nth-child(8)',market,'Remove outcome-claim slide and unrelated NMN customer video')
 for i,n in enumerate(s.select('.gallery-thumb')):n['aria-label']=f'View image {i+1} of 7';n['tabindex']='0'
 replace(s,'#gallery-count','1 / 7',market,'Gallery excludes the two unsupported media items')
 remove(s,'#gallery-video,#gallery-video-error',market,'Remove unrelated gallery video; retain the requested live review video')
 review_source=json.loads((ROOT/'audit/source/reviews-live.json').read_text())
 reviews=BeautifulSoup(review_source['html'],'html.parser').select_one('#reviews')
 s.select_one('#reviews').replace_with(reviews)
 (PUBLIC/'reviews.json').write_text(json.dumps(review_source['reviews'],ensure_ascii=False)+'\n')
 (ROOT/'source/reviews.html').write_text(str(reviews))
 (ROOT/'source/reviews.json').write_text(json.dumps(review_source['reviews'],ensure_ascii=False,indent=2)+'\n')
 changes.append({'location':'Reviews, review filters and customer video','before':'Sanitized excerpts, static filter label, product photograph','after':'Exact current live reviews, five filters and Matt Sorum NMN video','reason':'Owner explicitly requested the same live reviews and filters. This restores outcome words, including energy; the video retains its NMN label.'})
 replace(s,'.r51-science .r51-kicker','Fisetin · Cellular renewal and healthy aging',market,'Correct unrelated Spermidine heading')
 html(s,'.r51-science .r51-copy .r51-rich','<p>'+'</p><p>'.join([' '.join(APPROVED[:2]),APPROVED[5],' '.join(APPROVED[2:5])])+'</p>',market)
 replace(s,'.r60-callout-title','Supports cellular renewal and healthy aging.',market,'Remove guaranteed 45-day outcome')
 # Keep the complete attributed quote, exactly as supplied by the owner and live page.
 changes.append({'location':'.r51-expert blockquote','before':'Shortened excerpt','after':s.select_one('.r51-expert').get_text(' ',strip=True),'reason':'Owner requested the full original quote and attribution'})
 html(s,'.r60-process-info .r51-rich',detail['processIntro'],market,'Restore the source-to-capsule overview without superiority guarantees')
 for n,t in zip(s.select('.r60-process-step .r51-rich'),detail['process']):
  old=n.get_text(' ',strip=True);n.clear();n.append(BeautifulSoup(t,'html.parser'))
  changes.append({'location':'Source-to-capsule detail','before':old,'after':n.get_text(' ',strip=True),'reason':'Restore relevant sourcing, manufacturing, capsule, testing, bottling and delivery details'})
 remove(s,'.r60-formulas,.r51-foryou',market,'Owner requested removal of comparison, healthy-aging routine and quiz sections')
 faq=[('What is Fisetin?',APPROVED[1]),('What are senescent cells?',APPROVED[0]),('How does Fisetin support healthy aging?',APPROVED[1]),('Does Fisetin have antioxidant properties?',APPROVED[5]),('How much Fisetin should I take daily?',APPROVED[6]),('How much Fisetin is in each capsule?',APPROVED[2]),('How many capsules are in a jar?',APPROVED[3]),('Where is MASI Premium Fisetin made?','Made in Germany with German raw materials.'),('Where is MASI Premium Fisetin tested?','Third-party tested in Switzerland for purity.'),('Are the capsules vegan?',APPROVED[3])]
 for n,(q,a) in zip(s.select('.r51-faq-item'),faq):
  old=n.get_text(' ',strip=True);n.clear();n.append(BeautifulSoup('<summary>'+q+'</summary><div class="r51-rich"><p>'+a+'</p></div>','html.parser'))
  if market=='USD':changes.append({'location':'FAQ','before':old,'after':q+' '+a,'reason':'Approved facts only; remove treatment, interactions, safety and time-to-result assertions'})
 # Avoid showing the original prohibited text in hidden menus, image alts, and footer disclosures.
 for n in s.select('.ms-product-benefit'):n.string='Explore the formula.'
 for n in s.select('.ms-product-card[data-product="fisetin"] .ms-product-benefit'):n.string='Supports healthy aging.'
 remove(s,'.mft-disclosures',market,'Remove body-outcome legal disclaimer from this copy-restricted landing; retain policy links')
 for n in s.select('[alt]'):
  if re.search(r'energy|fat|cancer|treat|cure|prevent|diabetes|alzheimer|parkinson|inflamm',n['alt'],re.I):
   old=n['alt'];n['alt']='MASI Premium Fisetin'
   if market=='USD':changes.append({'location':'Image alt','before':old,'after':n['alt'],'reason':'Remove restricted words'})
 # This landing serves US customers only. Keep the original header styling.
 for n in s.select('.ms-localization,[data-ms-localization],.ms-locale,.ms-market,.ms-search,.ms-account'):n.decompose()
 for f in list(s.select('form')):
  if f.get('id')!='purchase':f.decompose()
 for n in list(s.select('details')):
  if n.find('summary') and re.search('region|language|country',n.find('summary').get('aria-label',''),re.I):n.decompose()
 controls=s.select_one('.ms-utilities')
 flag=BeautifulSoup('<span class="landing-market ms-market" aria-label="United States, USD"><img src="https://cdn.shopify.com/static/images/flags/us.svg?width=32" width="24" height="18" alt="United States"><span>USD</span></span>','html.parser')
 controls.insert(0,flag)
 shop=BeautifulSoup('<a class="ms-control ms-menu-trigger landing-shop" href="#purchase">Shop</a>','html.parser')
 s.select_one('.ms-menu').replace_with(shop)
 for n in s.select('.ms-primary a'):n['href']='#r58-lab' if n.get_text(strip=True)=='Lab results' else '#r51-science-title'
 cart=s.select_one('#cart-icon-bubble')
 cart['href']='#purchase';cart['aria-label']='View purchase options';cart['title']='View purchase options'
 for attr in ['data-checkout','aria-haspopup','aria-expanded']:cart.attrs.pop(attr,None)
 cart.select_one('.ms-sr-only').string='View purchase options'
 for n in s.select('.ms-promo a'):n['href']='#purchase'
 replace(s,'[data-ms-promo-copy]','SAVE UP TO 10% + GET $160 IN GIFTS',market,'Exact live USD announcement copy; masi-header.js re-renders it from the data attributes')
 # Snapshot the two original decorative canvases; no theme runtime scripts are carried over.
 for sel,file in [('masi-pdp-r58-cell','science-art.png'),('masi-pdp-r51-art','benefit-art.png')]:
  for n in s.select(sel):
   n.clear();im=s.new_tag('img',src='/assets/'+file,alt='');im['width']='550';im['height']='550';im['loading']='lazy';im['style']='width:100%;height:100%;object-fit:contain';n.append(im)
 remove(s,'#benefit-motion',market,'Static illustration replaces nonessential animation')
 # Keep all navigation links pointed at MASI; local purchase anchors stay local.
 for n in s.select('[href]'):
  href=n['href']
  if href.startswith('/') and not href.startswith('//'):n['href']='https://masi.eu'+href
  elif href.startswith('//'):n['href']='https:'+href
 for n in s.select('img'):
  if n.get('src') and '89969a300e23f9ad.png' in n['src']:n['src']=n['src'].replace('89969a300e23f9ad.png','89969a300e23f9ad_800x.png')
  if n.get('src') and '/files/' in n['src'] and any('/'+name+'.png?' in n['src'] for name in ['429','430','431']):n['src']=n['src'].replace('width=480','width=320')
  for a in ['src','data-display','data-full']:
   if n.get(a):n[a]=local(n[a])
  if n.get('srcset'):
   n['srcset']=', '.join(local(part.strip().split()[0])+' '+' '.join(part.strip().split()[1:]) for part in n['srcset'].split(','))
  if not n.get('fetchpriority'):n['loading']='lazy'
 for n in s.select('video[src],source[src]'):n['src']=url(n['src'])
 # Data needed for a direct checkout only; no catalog feeds or product metadata.
 v=d['config']['products']['fisetin']['variants'][0]
 config={'currency':market,'country':'US','variant':v['id'],'productName':'Premium Fisetin','capturedAt':d['capturedAt'],'gifts':d['config']['gifts'],'plans':{'90':{'id':d['plan']['plan'],'qty':3,'unit':d['plan']['unit'],'pct':10,'weeks':12},'30':{'id':v['plan']['id'],'qty':1,'unit':v['plan']['price'],'pct':5,'weeks':4},'once':{'id':None,'qty':1,'unit':v['price'],'pct':0}},'list':v['price']}
 for g in config['gifts']:g.pop('image',None)
 js=s.new_tag('script',id='landing-data',type='application/json');js.string=json.dumps(config,separators=(',',':'));s.body.append(js)
 cookie='''<section id="cookie-banner" aria-labelledby="cookie-title" aria-describedby="cookie-description" hidden><h2 id="cookie-title">Your privacy matters</h2><p id="cookie-description">We use cookies and similar technologies to run the store, measure performance, and (where allowed) personalize marketing. <a href="https://masi.eu/policies/privacy-policy">Privacy Policy</a></p><div class="cookie-actions"><button type="button" data-consent="reject">Reject non-essential</button><button type="button" data-consent="settings">Preferences</button><button type="button" data-consent="accept">Accept all</button></div><div id="cookie-preferences" hidden><label><input type="checkbox" id="consent-analytics"> Analytics</label><label><input type="checkbox" id="consent-marketing"> Marketing</label><button type="button" data-consent="save">Save preferences</button></div></section>'''
 s.select_one('.mft-privacy').append(BeautifulSoup(cookie,'html.parser'))
 c=json.loads((ROOT/'source/cookie-banner.json').read_text())
 s.select_one('#cookie-title').string=c['title'];node=s.select_one('#cookie-description');node.clear();node.append(c['text']);a=s.new_tag('a',href=c['policyLinkUrl']);a.string=c['policyLinkText'];node.append(a)
 for action,key in [('reject','buttonDeclineText'),('settings','buttonPrefsOpenText'),('accept','buttonAcceptText')]:s.select_one('[data-consent='+action+']').string=c[key]

 foot=s.select_one('.mft-privacy');button=s.new_tag('button',type='button',id='cookie-open');button.string='Cookie preferences';foot.append(button)
 s.body.append(BeautifulSoup('<script src="/masi-header.js"></script><script type="module" src="/app.js"></script>','html.parser'))
 # Preserve actual stylesheet order from the live page, excluding unrelated app/cart styles.
 styles=[]
 for u in d['styles']:
  if any(t in u for t in ['masi-action-shape','base.min','custom.main_styles','masi-header-r31','masi-r28-pdp','masi-pdp-r60.css','masi-pdp-r51.css','masi-pdp-r58.css','masi-pdp-r60-motion','masi-footer-r43']):
   if u not in styles:styles.append(u)
 css='\n'.join(d['inlineStyles'][i] for i in [2,3])
 for u in styles:
  req=urllib.request.Request(u,headers={'User-Agent':'Mozilla/5.0'})
  raw=urllib.request.urlopen(req,timeout=40).read().decode()
  raw=re.sub(r'/\*# sourceMappingURL=.*?\*/','',raw)
  raw=re.sub(r'url\([\'"]?([^\)\'\"]+)[\'"]?\)',lambda m:'url("'+local(url(m[1],u))+'")' if not m[1].startswith(('data:','#')) else m[0],raw)
  css+='\n'+raw
 css+='\n'+d['inlineStyles'][19]
 css=re.sub(r'url\([\'"]?(//[^\)\'\"]+)[\'"]?\)',lambda m:'url("'+local(m[1])+'")',css)
 (PUBLIC/'live.css').write_text(css)
 head=f'''<meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>MASI Premium Fisetin | Healthy Aging</title><meta name="description" content="MASI Premium Fisetin supports cellular renewal and healthy aging. 250 mg per capsule. 60 vegan capsules. Made in Germany, tested in Switzerland."><meta property="og:type" content="website"><meta property="og:title" content="MASI Premium Fisetin | Healthy Aging"><meta property="og:description" content="Supports cellular renewal and healthy aging."><link rel="stylesheet" href="/live.css"><link rel="stylesheet" href="/landing.css">'''
 s.head.append(BeautifulSoup(head,'html.parser'))
 out=PUBLIC/'index.html';out.parent.mkdir(exist_ok=True)
 out.write_text(str(s))
 # Retain the old preview route, with the same US-only content.
 (PUBLIC/'usd/index.html').write_text(str(s))
 # The public data file is a source/price snapshot, with no raw Shopify HTML or visitor information.
 (ROOT/'source'/f'{market}-catalog.json').write_text(json.dumps(config,indent=2)+'\n')
 print(market,len(str(s)),len(css))
(ROOT/'source/asset-manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
changes.append({'location':'Approved copy correction','before':'60 vegan capsules per jar, clean formula with no fillers.','after':'60 vegan capsules per jar.','reason':'Owner confirmed omission after the live ingredient label listed rice bran'})
(ROOT/'audit/copy-changes.json').write_text(json.dumps(changes,indent=2,ensure_ascii=False)+'\n')
print('Assets:',len(manifest),'Changes:',len(changes))
