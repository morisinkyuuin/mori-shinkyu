const { chromium } = require('playwright');
const path = require('path');
(async () => {
  const url = 'file://' + path.resolve(__dirname, '../index.html');
  const b = await chromium.launch();
  const errs = [];
  for (const [name, w, h] of [['mobile', 375, 812], ['desktop', 1280, 900]]) {
    const p = await b.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 2 });
    await p.goto(url);
    const r = await p.evaluate(() => ({
      sw: document.documentElement.scrollWidth, iw: window.innerWidth,
      tel: document.querySelectorAll('a[href^="tel:"]').length,
      missing: [...document.querySelectorAll('a[href^="#"]')].map(a => a.getAttribute('href')).filter(h => h.length > 1 && !document.querySelector(h)),
      ids: ['top','symptoms','first','price','staff','access','contact'].filter(i => !document.getElementById(i)),
      todo: (document.body.innerText.match(/【要確認】/g) || []).length,
    }));
    if (r.sw > r.iw) errs.push(`${name}: horizontal scroll ${r.sw}>${r.iw}`);
    if (r.tel < 3) errs.push(`${name}: tel links ${r.tel}<3`);
    if (r.missing.length) errs.push(`${name}: missing anchors ${r.missing}`);
    if (r.ids.length) errs.push(`${name}: missing sections ${r.ids}`);
    console.log(name, '要確認:', r.todo);
    await p.screenshot({ path: path.resolve(__dirname, `../screenshot-${name}.png`), fullPage: true });
  }
  await b.close();
  if (errs.length) { console.log(errs.join('\n')); process.exit(1); }
  console.log('ALL OK');
})().catch(e => { console.log('FAIL', e.message); process.exit(1); });
