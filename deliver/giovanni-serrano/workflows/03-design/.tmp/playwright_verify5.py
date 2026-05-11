import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots" / "after"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()

        # Sell tablet
        page = await browser.new_page(viewport={"width": 1024, "height": 768})
        await page.goto((BASE / "service-template-sell.html").as_uri(), wait_until="networkidle")
        pane = await page.query_selector(".site-pane")
        box = await pane.bounding_box()
        print(f"Sell tablet site-pane: {int(box['width'])}x{int(box['height'])}")
        await page.evaluate(f"window.scrollTo(0, {int(box['y'])})")
        await page.wait_for_timeout(1500)
        await page.screenshot(path=str(OUT / "sell_tablet_sitepane_v.png"))
        await page.close()

        # Mobile — verify panes are hidden
        page = await browser.new_page(viewport={"width": 390, "height": 844})
        for name, selector, filename in [
            ("scale", ".dcf-pane", "service-template-scale.html"),
            ("develop", ".site-pane", "service-template-develop.html"),
        ]:
            await page.goto((BASE / filename).as_uri(), wait_until="networkidle")
            pane = await page.query_selector(selector)
            box = await pane.bounding_box()
            print(f"Mobile {name} pane hidden: {box is None}")
        await page.close()

        await browser.close()
    print("Done.")

asyncio.run(main())
