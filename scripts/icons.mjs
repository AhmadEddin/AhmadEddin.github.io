import { chromium } from 'playwright';
import fs from 'node:fs';
const [svgPath, outDir] = process.argv.slice(2);
const svg = fs.readFileSync(svgPath, 'utf8');
const b = await chromium.launch();
for (const [size, name] of [[32, 'favicon-32.png'], [180, 'apple-touch-icon.png']]) {
  const p = await b.newPage({ viewport: { width: size, height: size } });
  await p.setContent(`<html><body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await p.screenshot({ path: `${outDir}/${name}` });
}
await b.close();
console.log('icons ok');
