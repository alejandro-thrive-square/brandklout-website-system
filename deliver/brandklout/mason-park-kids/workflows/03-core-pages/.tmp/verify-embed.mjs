// The Maps embed only renders inside an iframe. Render old and new side by side and look.
// node verify-embed.mjs > verify-embed.log
import { chromium } from 'playwright-core';

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const OLD =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.75121988455305!3d29.775949038160515!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x86412740e7dd5def%3A0xfa1ab8c6e696e133!2sMason%20Park%20Dental%20-%20Katy%20Dentist!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus';
const NEW =
  'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3463.0585305167815!2d-95.7490312!3d29.7759444!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8641277706112ec1%3A0x98941d027afdec7b!2sMason%20Park%20Dental%20for%20Kids%20-%20Pediatric%20Dentist%20Katy%20TX!5e0!3m2!1sen!2sus!4v1638807674675!5m2!1sen!2sus';

const browser = await chromium.launch({ executablePath: CHROME, headless: true });
const page = await browser.newPage({ viewport: { width: 1280, height: 560 } });
await page.setContent(
  `<body style="margin:0;display:flex;font:14px system-ui">
   <div style="flex:1"><p style="margin:4px">OLD (adult)</p><iframe src="${OLD}" style="width:100%;height:480px;border:0"></iframe></div>
   <div style="flex:1"><p style="margin:4px">NEW (pediatric)</p><iframe src="${NEW}" style="width:100%;height:480px;border:0"></iframe></div>
   </body>`,
  { waitUntil: 'load' }
);
await page.waitForTimeout(9000);
await page.screenshot({ path: 'embed-compare.png' });
console.log('written embed-compare.png');
await browser.close();
