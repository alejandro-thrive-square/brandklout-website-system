// Alki House WhatsApp Business catalogue -> one JSON string, built inside a logged-in
// web.whatsapp.com tab (Claude in Chrome javascript_tool). Open the Anferny chat and its catalogue
// once first, so the Catalog model exists. Leaves the payload in window.__alkiJson; hand it out
// with recv.mjs (see README.md) - a Chrome download of it was silently removed on 2026-10-09.
//
// The UI stops paging "Todos los artículos" at 10 products; the model's own calls do not.
const C = window.require('WAWebCollections').Catalog;
const cat = C.getModelsArray()[0];

// 1. Every product page (20 a call) until the cursor runs out.
for (let i = 0; i < 60; i++) {
  const before = cat.productCollection.length;
  await C.findNextProductPage(cat.id, 50);
  if (!cat.afterCursor || cat.productCollection.length === before) break;
}

// 2. Every collection's members (the panel only holds the first three of each).
const cs = cat.collections;
for (const coll of cs.getModelsArray()) {
  for (let i = 0; i < 30; i++) {
    const before = coll.productCollection.length;
    if (i > 0 && !coll.afterCursor) break;
    await cs.findCollectionProducts({ catalogWid: cat.id, collectionId: coll.id, afterCursor: coll.afterCursor || '', productsLimit: 50 });
    if (coll.productCollection.length === before) break;
  }
}
const memb = {};
for (const c of cs.getModelsArray())
  for (const p of c.productCollection.getModelsArray())
    (memb[p.id] = memb[p.id] || []).push(c.name.replace(/[^\p{L}\p{N} ]/gu, '').trim());

// 3. Rows in catalogue order, with every image fetched now (the CDN URLs are signed and expire).
const toDataUrl = (b) => new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result); r.onerror = rej; r.readAsDataURL(b); });
const products = [];
for (const [i, p] of cat.productCollection.getModelsArray().entries()) {
  const a = p.attributes;
  const urls = [a.imageCdnUrl, ...(Array.isArray(a.additionalImageCdnUrl) ? a.additionalImageCdnUrl : [])].filter(Boolean);
  const imageFiles = [];
  for (const u of urls) {
    try {
      const b = await (await fetch(u)).blob();
      const bm = await createImageBitmap(b);
      imageFiles.push({ type: b.type, size: b.size, w: bm.width, h: bm.height, data: await toDataUrl(b) });
    } catch { imageFiles.push(null); }
  }
  products.push({
    order: i + 1, waId: p.id, name: (a.name || '').trim(), description: a.description || '',
    availability: a.availability, maxAvailable: a.maxAvailable, isHidden: a.isHidden, reviewStatus: a.reviewStatus,
    currency: a.currency, priceAmount1000: a.priceAmount1000, salePriceAmount1000: a.salePriceAmount1000,
    retailerId: a.retailerId, url: a.url, imageCount: a.imageCount, videos: a.videos,
    collections: memb[p.id] || [], t: a.t, imageFiles,
  });
}
window.__alkiJson = JSON.stringify({
  business: { name: 'Alki House', wid: String(cat.id), collections: cs.getModelsArray().map((c) => ({ id: c.id, name: c.name, count: c.productCollection.length })) },
  extractedAt: new Date().toISOString(),
  products,
});
`${products.length} products, ${(window.__alkiJson.length / 1e6).toFixed(1)} MB`;
