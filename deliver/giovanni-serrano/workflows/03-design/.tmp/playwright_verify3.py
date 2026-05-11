import asyncio
from pathlib import Path
from playwright.async_api import async_playwright
from PIL import Image
import io

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots" / "after"
OUT.mkdir(exist_ok=True, parents=True)

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Scale tablet — scroll to dcf-pane for animation, then screenshot
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-scale.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".dcf-pane")
        await pane.scroll_into_view_if_needed()
        await page.wait_for_timeout(1500)  # let bars animate
        box = await pane.bounding_box()
        full = await page.screenshot(full_page=True)
        img = Image.open(io.BytesIO(full))
        cropped = img.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
        cropped.save(str(OUT / "scale_tablet_dcfpane_anim.png"))
        print(f"Scale tablet pane: {int(box['width'])}x{int(box['height'])}")
        await page.close()

        # Develop tablet — site-pane
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-develop.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".site-pane")
        await pane.scroll_into_view_if_needed()
        await page.wait_for_timeout(1500)
        box = await pane.bounding_box()
        full = await page.screenshot(full_page=True)
        img = Image.open(io.BytesIO(full))
        cropped = img.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
        cropped.save(str(OUT / "develop_tablet_sitepane_anim.png"))
        await page.close()

        # Invest tablet — cross-section
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-invest.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".cross-section")
        await pane.scroll_into_view_if_needed()
        await page.wait_for_timeout(1500)
        box = await pane.bounding_box()
        full = await page.screenshot(full_page=True)
        img = Image.open(io.BytesIO(full))
        cropped = img.crop((int(box['x']), int(box['y']), int(box['x'] + box['width']), int(box['y'] + box['height'])))
        cropped.save(str(OUT / "invest_tablet_cspane_anim.png"))
        await page.close()

        await browser.close()
    print("Done.")

asyncio.run(main())
