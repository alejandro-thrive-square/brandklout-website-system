import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots" / "after"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Scale tablet DCF pane — viewport screenshot after scroll
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-scale.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".dcf-pane")
        box = await pane.bounding_box()
        print(f"Scale dcf-pane: x={box['x']:.0f} y={box['y']:.0f} w={box['width']:.0f} h={box['height']:.0f}")
        await page.evaluate(f"window.scrollTo(0, {int(box['y'])})")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "scale_tablet_dcfpane_v.png"))
        await page.close()

        # Develop tablet site-pane
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-develop.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".site-pane")
        box = await pane.bounding_box()
        print(f"Develop site-pane: x={box['x']:.0f} y={box['y']:.0f} w={box['width']:.0f} h={box['height']:.0f}")
        await page.evaluate(f"window.scrollTo(0, {int(box['y'])})")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "develop_tablet_sitepane_v.png"))
        await page.close()

        # Invest tablet cross-section
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-invest.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".cross-section")
        box = await pane.bounding_box()
        print(f"Invest cross-section: x={box['x']:.0f} y={box['y']:.0f} w={box['width']:.0f} h={box['height']:.0f}")
        await page.evaluate(f"window.scrollTo(0, {int(box['y'])})")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "invest_tablet_cspane_v.png"))
        await page.close()

        await browser.close()
    print("Done.")

asyncio.run(main())
