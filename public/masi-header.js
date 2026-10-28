// MASI header r31 (theme assets/masi-header-r31.js), guarded for the landing: no market disclosures here.
if (!customElements.get('masi-site-header')) {
  customElements.define('masi-site-header', class extends HTMLElement {
    connectedCallback() {
      this.controller?.abort();
      this.controller = new AbortController();
      const { signal } = this.controller;
      const disclosures = [...this.querySelectorAll('.ms-disclosure')];
      const section = this.closest('.masi-header-section');
      const header = this.querySelector('[data-ms-header]');
      if (!section || !header) return;
      const promo = this.querySelector('[data-ms-promo]');
      const promoCopy = this.querySelector('[data-ms-promo-copy]');
      if (promoCopy) {
        const data = promoCopy.dataset;
        const value = new Intl.NumberFormat(data.msLocale, {style:'currency', currency:data.msCurrency, minimumFractionDigits:0, maximumFractionDigits:2}).format(Number(data.msGiftValue) / 100);
        promoCopy.textContent = data.msPromoTemplate.replace('[value]', value);
      }
      this.querySelectorAll('[data-ms-close]').forEach(button => { button.hidden = false; });
      const remember = () => {
        document.cookie = 'localization_cookie=true; Max-Age=1209600; Path=/; SameSite=Lax; Secure';
      };
      const measure = () => {
        const bottom = Math.max(0, header.getBoundingClientRect().bottom);
        const toolbar = document.getElementById('PBarNextFrameWrapper')?.getBoundingClientRect();
        const toolbarHeight = toolbar?.bottom >= innerHeight - 2 ? toolbar.height : 0;
        section.style.setProperty('--ms-promo-height', `${promo?.offsetHeight || 0}px`);
        this.style.setProperty('--ms-header-bottom', `${bottom}px`);
        this.style.setProperty('--ms-preview-height', `${toolbarHeight || 0}px`);
        document.documentElement.style.setProperty('--header-height', `${header.offsetHeight}px`);
        document.documentElement.style.setProperty('--announcement-height', `${Math.max(0, bottom - header.offsetHeight)}px`);
        document.documentElement.style.setProperty('--headerGroup-height', `${bottom}px`);
      };
      const close = (details, restoreFocus = false) => {
        details.open = false;
        details.querySelector('summary')?.setAttribute('aria-expanded', 'false');
        if (details.classList.contains('ms-market')) remember();
        if (restoreFocus) details.querySelector('summary')?.focus({ preventScroll: true });
      };
      const updateReturns = () => {
        const params = new URLSearchParams(location.search);
        ['country', 'currency', 'locale'].forEach(key => params.delete(key));
        const query = params.toString();
        this.querySelectorAll('[data-ms-return]').forEach(button => {
          const field = button.form?.elements.return_to;
          if (field) field.value = button.dataset.msReturn + (query ? `?${query}` : '') + location.hash;
        });
      };
      disclosures.forEach(details => {
        const trigger = details.querySelector('summary');
        if (!trigger) return;
        trigger.setAttribute('aria-expanded', String(details.open));
        details.addEventListener('toggle', () => {
          trigger.setAttribute('aria-expanded', String(details.open));
          if (!details.open) return;
          disclosures.forEach(other => { if (other !== details) close(other); });
          measure();
          updateReturns();
        }, { signal });
        details.querySelector('[data-ms-close]')?.addEventListener('click', () => close(details, true), { signal });
        details.addEventListener('focusout', event => {
          if (details.open && event.relatedTarget && !details.contains(event.relatedTarget)) close(details);
        }, { signal });
      });
      document.addEventListener('click', event => {
        disclosures.forEach(details => {
          if (!details.open) return;
          // The backdrop is a pseudo-element of details; it must close, not toggle another control.
          if (event.target === details || !details.contains(event.target)) close(details);
        });
      }, { signal });
      document.addEventListener('keydown', event => {
        const open = disclosures.find(details => details.open);
        if (open && event.key === 'Escape') { event.preventDefault(); close(open, true); }
      }, { signal });
      this.addEventListener('submit', event => {
        if (event.target.closest?.('.ms-market-group')) { updateReturns(); remember(); }
      }, { signal });
      window.addEventListener('scroll', measure, { signal, passive: true });
      window.addEventListener('resize', measure, { signal });
      window.addEventListener('load', measure, { signal });
      this.observer = new ResizeObserver(measure);
      this.observer.observe(header);
      if (promo) this.observer.observe(promo);
      updateReturns();
      measure();
    }
    disconnectedCallback() {
      this.controller?.abort();
      this.observer?.disconnect();
    }
  });
}
