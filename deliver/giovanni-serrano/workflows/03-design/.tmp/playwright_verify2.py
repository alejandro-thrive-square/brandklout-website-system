import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image
import io

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots" / "after"
OUT.mkdir(exist_ok=True, parents=True)

VIEWPORTS = [
    ("tablet", 1024, 768),
    ("mobile", 390, 844),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Index hero with portrait
        for vp_name, width, height in VIEWPORTS:
            page = await browser.new_page(viewport={"width": width, "height": height})
            await page.goto((BASE / "index.html").as_uri(), wait_until="networkidle")
            await page.wait_for_timeout(600)
            # Full page screenshot then crop to hero
            full = await page.screenshot(full_page=True)
            hero = await page.query_selector(".hero")
            box = await hero.bounding_box()
            print(f"Index {vp_name}: hero bbox = {int(box['x'])},{int(box['y'])} {int(box['width'])}x{int(box['height'])}")
            img = Image.open(io.BytesIO(full))
            cropped = img.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
            cropped.save(str(OUT / f"index_{vp_name}_hero_full.png"))
            await page.close()

        # Service page DCF pane at tablet
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-scale.html").as_uri(), wait_until="networkidle")
        await page.wait_for_timeout(600)
        full = await page.screenshot(full_page=True)
        pane = await page.query_selector(".dcf-pane")
        box = await pane.bounding_box()
        print(f"Scale tablet: dcf-pane = {int(box['width'])}x{int(box['height'])}")
        img = Image.open(io.BytesIO(full))
        cropped = img.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
        cropped.save(str(OUT / "scale_tablet_dcfpane.png"))
        await page.close()

        await browser.close()
    print("Done.")

asyncio.run(main())
