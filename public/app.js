import { oneTimeUrl, subscriptionUrl } from './checkout.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const config = JSON.parse($('#landing-data').textContent);
const form = $('#purchase');
const cta = $('#purchase .cta');
const error = $('#purchase-error');
const cards = { '90': $('#three-month-card'), '30': $('#subscribe-card'), once: $('#one-time-card') };
const radio = { '90': $('#three-month'), '30': $('#subscribe'), once: $('#one-time') };
const money = cents => new Intl.NumberFormat('en-US', { style: 'currency', currency: config.currency }).format(cents / 100);
let selected = '90';
let busy = false;

function select(key) {
  if (!cards[key] || busy) return;
  selected = key;
  const p = config.plans[key];
  for (const [id, card] of Object.entries(cards)) {
    card.classList.toggle('selected', id === key);
    radio[id].checked = id === key;
  }
  form.classList.toggle('is-3m', key === '90');
  $('#m3-body').hidden = key !== '90';
  $('#subscribe-body').hidden = key !== '30';
  $('#sub-checklist-slot').hidden = key !== '30';
  cards[key].append(cta, error);
  cta.setAttribute('aria-label', `START NOW. ${p.qty} ${p.qty === 1 ? 'jar' : 'jars'}. ${money(p.unit * p.qty)}`);
  $('#sticky-cta').setAttribute('aria-label', cta.getAttribute('aria-label'));
  const title = key === 'once' ? 'One Time Purchase · 1 jar' : `${key}-Day Supply · ${p.qty} ${p.qty === 1 ? 'jar' : 'jars'}`;
  $('#sticky-plan').textContent = title;
  $('#sticky-selection').textContent = title;
  $('#sticky-total').textContent = money(p.unit * p.qty);
  $('#sticky-list').textContent = money(config.list * p.qty);
  $('#sticky-list').hidden = key === 'once';
  $('#sticky-discount').textContent = `Save ${p.pct}%`;
  $('#sticky-discount').hidden = key === 'once';
  $('#sticky-day').textContent = money(Math.round(p.unit / 30)) + '/day';
  $('#renewal-copy').textContent = p.id ? `Renews at ${money(p.unit * p.qty)} every ${p.weeks} weeks.` : 'Billed once · no subscription.';
  $('#subscription-terms-link').hidden = !p.id;
  $('#price-announcement').textContent = title + '. ' + money(p.unit * p.qty);
  error.hidden = true;
}
for (const [key, input] of Object.entries(radio)) input.addEventListener('change', () => select(key));
select('90');

// Consent is independent of Shopify cookies. Load neither analytics nor marketing
// until the visitor grants the corresponding purpose on this origin.
let consent = { analytics: false, marketing: false };
let analyticsLoaded = false;
let pixelLoaded = false;
try { consent = JSON.parse(localStorage.getItem('masi-fisetin-consent')) || consent; } catch {}
const loadScript = src => { const s = document.createElement('script'); s.src = src; s.async = true; document.head.append(s); };
function applyConsent() {
  if (consent.analytics && !analyticsLoaded) {
    analyticsLoaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function () { window.dataLayer.push(arguments); };
    window.gtag('js', new Date());
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    // Both GA4 destinations were observed on the live Fisetin page.
    for (const id of ['G-H98Q4W0J4S', 'G-22PSYBQM5W']) window.gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
    loadScript('https://www.googletagmanager.com/gtag/js?id=G-H98Q4W0J4S');
    window.gtag('event', 'view_item', { currency: config.currency, value: config.plans[selected].unit * config.plans[selected].qty / 100 });
  }
  if (consent.marketing && !pixelLoaded) {
    pixelLoaded = true;
    const fbq = window.fbq = function () { fbq.callMethod ? fbq.callMethod.apply(fbq, arguments) : fbq.queue.push(arguments); };
    fbq.push = fbq; fbq.loaded = true; fbq.version = '2.0'; fbq.queue = [];
    window._fbq = fbq;
    fbq('set', 'autoConfig', false, '1459202204862031');
    fbq('init', '1459202204862031');
    fbq('consent', 'grant');
    loadScript('https://connect.facebook.net/en_US/fbevents.js');
    fbq('trackSingle', '1459202204862031', 'PageView');
    fbq('trackSingle', '1459202204862031', 'ViewContent', { content_name: 'MASI Premium Fisetin', currency: config.currency, value: config.plans[selected].unit * config.plans[selected].qty / 100 });
  }
}
function saveConsent(next) {
  const revoked = (consent.marketing && !next.marketing) || (consent.analytics && !next.analytics);
  consent = next;
  try { localStorage.setItem('masi-fisetin-consent', JSON.stringify(next)); } catch {}
  $('#cookie-banner').hidden = true;
  if (revoked) {
    window.fbq?.('consent', 'revoke');
    window.gtag?.('consent', 'update', { analytics_storage: 'denied', ad_storage: 'denied' });
    location.reload(); return;
  }
  applyConsent();
}
$$('[data-consent]').forEach(button => button.addEventListener('click', () => {
  const action = button.dataset.consent;
  if (action === 'settings') { $('#cookie-preferences').hidden = false; return; }
  saveConsent(action === 'save' ? { analytics: $('#consent-analytics').checked, marketing: $('#consent-marketing').checked } : { analytics: action === 'accept', marketing: action === 'accept' });
}));
$('#cookie-open').addEventListener('click', () => {
  $('#consent-analytics').checked = consent.analytics;
  $('#consent-marketing').checked = consent.marketing;
  $('#cookie-preferences').hidden = false;
  $('#cookie-banner').hidden = false;
  $('#cookie-banner').scrollIntoView({ behavior: 'smooth', block: 'center' });
  $('#cookie-banner button').focus({ preventScroll: true });
});
// Preferences are available in the footer. Never show an automatic privacy popup.
$('#cookie-banner').hidden = true;
applyConsent();

async function checkout(event) {
  event.preventDefault();
  if (busy) return;
  busy = true;
  error.hidden = true;
  const key = selected;
  const p = config.plans[key];
  const label = cta.innerHTML;
  cta.textContent = 'Opening checkout…';
  $$('input[name="landing-plan"],#purchase .cta,#sticky-cta,[data-checkout]').forEach(n => n.disabled = true);
  try {
    const destination = key === 'once' ? oneTimeUrl(config, location.search) : await subscriptionUrl(config, key, location.search);
    const payload = { currency: config.currency, value: p.qty * p.unit / 100, num_items: p.qty };
    if (consent.marketing) window.fbq?.('trackSingle', '1459202204862031', 'InitiateCheckout', payload);
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 800);
      if (consent.analytics && window.gtag) {
        window.gtag('event', 'begin_checkout', { ...payload, transport_type: 'beacon', event_timeout: 700, event_callback: () => { clearTimeout(timer); resolve(); } });
      } else { clearTimeout(timer); setTimeout(resolve, 180); }
    });
    location.assign(destination);
  } catch (e) {
    error.textContent = e.name === 'TimeoutError' ? 'Checkout took too long. Please try again.' : e.message;
    error.hidden = false;
    error.setAttribute('role', 'alert');
  } finally {
    cta.innerHTML = label;
    busy = false;
    $$('input[name="landing-plan"],#purchase .cta,#sticky-cta,[data-checkout]').forEach(n => n.disabled = false);
  }
}
form.addEventListener('submit', checkout);
$$('[data-checkout]').forEach(n => n.addEventListener('click', checkout));
// Secondary purchase actions also take the selected option straight to checkout.
$$('[data-r51-purchase]').forEach(n => n.addEventListener('click', checkout));

let galleryIndex = 0;
const thumbs = $$('.gallery-thumb');
function gallery(index) {
  galleryIndex = (index + thumbs.length) % thumbs.length;
  thumbs.forEach((button, i) => button.setAttribute('aria-pressed', String(i === galleryIndex)));
  const thumb = thumbs[galleryIndex].querySelector('img');
  const image = $('#gallery-image');
  image.src = thumb.dataset.display; image.removeAttribute('srcset'); image.dataset.full = thumb.dataset.full; image.alt = thumb.alt;
  $('#gallery-count').textContent = `${galleryIndex + 1} / ${thumbs.length}`;
  $('#gallery-status').textContent = `Product image ${galleryIndex + 1} of ${thumbs.length}`;
}
thumbs.forEach((button, i) => button.addEventListener('click', () => gallery(i)));
$('#gallery-prev').addEventListener('click', () => gallery(galleryIndex - 1));
$('#gallery-next').addEventListener('click', () => gallery(galleryIndex + 1));
$('#gallery-enlarge').addEventListener('click', () => { $('#gallery-zoom-image').src = $('#gallery-image').dataset.full; $('#gallery-zoom-image').alt = $('#gallery-image').alt; $('#gallery-dialog').showModal(); });
$('#gallery-close').addEventListener('click', () => $('#gallery-dialog').close());
for (const dialog of $$('dialog')) dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
$$('[data-open]').forEach(button => button.addEventListener('click', e => {
  const target = document.getElementById(button.dataset.open);
  if (!target) return;
  e.preventDefault();
  $('#info-dialog-title').textContent = target.querySelector('summary')?.textContent.trim() || 'Product details';
  const copy = target.cloneNode(true); copy.querySelector('summary')?.remove();
  $('#info-dialog-content').replaceChildren(...copy.childNodes);
  $('#info-dialog').showModal();
}));
$('#info-dialog-back').addEventListener('click', () => $('#info-dialog').close());
$('#details-toggle').addEventListener('click', e => {
  const open = e.currentTarget.getAttribute('aria-expanded') !== 'true';
  $$('.accordions details').forEach(n => n.open = open);
  e.currentTarget.setAttribute('aria-expanded', String(open));
  e.currentTarget.textContent = open ? 'Collapse all' : 'Expand all';
});
$$('[data-ms-close]').forEach(button => button.addEventListener('click', () => { const d = button.closest('details'); if (d) d.open = false; }));
$$('.ms-disclosure').forEach(d => d.addEventListener('toggle', () => d.querySelector('summary')?.setAttribute('aria-expanded', String(d.open))));
$('#sticky-selection').addEventListener('click', () => form.scrollIntoView({ behavior: 'smooth', block: 'start' }));
new IntersectionObserver(entries => {
  $('#sticky-purchase').hidden = entries[0].isIntersecting || form.getBoundingClientRect().top > 0;
}, { threshold: 0 }).observe(form);

import './reviews.js';
