export const CART_QUERY = `mutation FisetinCheckout($input: CartInput!) {
  cartCreate(input: $input) {
    cart {
      checkoutUrl
      attributes { key value }
      cost { subtotalAmount { amount currencyCode } }
      lines(first: 12) { nodes {
        quantity
        merchandise { ... on ProductVariant { id } }
        sellingPlanAllocation { sellingPlan { id name } }
        cost { totalAmount { amount currencyCode } }
      } }
    }
    userErrors { field message }
  }
}`;
export function attribution(search) {
  return [...new URLSearchParams(search)].filter(([key]) => /^utm_[a-z0-9_]+$/i.test(key));
}
export function oneTimeUrl(config, search) {
  const prefix = config.currency === 'USD' ? '/en-usd' : '';
  const u = new URL(`https://masi.eu${prefix}/cart/${config.variant}:1`);
  for (const [key, value] of attribution(search)) {
    u.searchParams.set(key, value);
    u.searchParams.set(`attributes[${key}]`, value);
  }
  return u.href;
}
export function cartInput(config, key, search) {
  const plan = config.plans[key];
  if (!plan?.id) throw new Error('Select a subscription plan.');
  return {
    buyerIdentity: { countryCode: config.country },
    attributes: [{ key: 'landing', value: 'fisetin' }, ...attribution(search).map(([key, value]) => ({ key, value }))],
    lines: [
      { merchandiseId: `gid://shopify/ProductVariant/${config.variant}`, quantity: plan.qty, sellingPlanId: `gid://shopify/SellingPlan/${plan.id}` },
      ...config.gifts.map(gift => ({ merchandiseId: `gid://shopify/ProductVariant/${gift.id}`, quantity: 1, attributes: [{ key: '_masi_role', value: 'welcome_gift' }] })),
    ],
  };
}
export function verifyCart(cart, config, key) {
  const p = config.plans[key];
  const lines = cart.lines.nodes;
  const product = lines.filter(line => line.merchandise.id === `gid://shopify/ProductVariant/${config.variant}`);
  const cents = value => Math.round(Number(value) * 100);
  // Shopify's automatic gift discount can split the Fisetin line into 2 + 1.
  // Verify aggregate quantity and every allocation instead of assuming one line.
  if (product.reduce((q, l) => q + l.quantity, 0) !== p.qty ||
      product.some(l => l.sellingPlanAllocation?.sellingPlan.id !== `gid://shopify/SellingPlan/${p.id}`) ||
      product.reduce((sum, l) => sum + cents(l.cost.totalAmount.amount), 0) !== p.unit * p.qty ||
      cart.cost.subtotalAmount.currencyCode !== config.currency ||
      cents(cart.cost.subtotalAmount.amount) !== p.unit * p.qty ||
      config.gifts.some(g => {
        const gifts = lines.filter(l => l.merchandise.id === `gid://shopify/ProductVariant/${g.id}`);
        return gifts.length !== 1 || gifts[0].quantity !== 1 || cents(gifts[0].cost.totalAmount.amount) !== 0;
      }) || lines.some(l => ![config.variant, ...config.gifts.map(g => g.id)].some(id => l.merchandise.id === `gid://shopify/ProductVariant/${id}`))) {
    throw new Error('The current price or gift offer has changed. Please check the current offer at masi.eu before ordering.');
  }
  const checkout = new URL(cart.checkoutUrl);
  if (checkout.protocol !== 'https:' || checkout.hostname !== 'masi.eu') throw new Error('Checkout could not be verified. Please try again.');
  return checkout;
}
export async function subscriptionUrl(config, key, search, request = fetch) {
  const response = await request('https://masi.eu/api/2026-10/graphql.json', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query: CART_QUERY, variables: { input: cartInput(config, key, search) } }),
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error('Checkout is unavailable. Please try again.');
  const result = await response.json();
  if (result.errors?.length || result.data?.cartCreate?.userErrors?.length || !result.data?.cartCreate?.cart) {
    throw new Error('This purchase option is unavailable. Please try again.');
  }
  const url = verifyCart(result.data.cartCreate.cart, config, key);
  for (const [name, value] of attribution(search)) url.searchParams.set(name, value);
  return url.href;
}
