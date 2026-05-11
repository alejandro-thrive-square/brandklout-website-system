import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots" / "after"
OUT.mkdir(exist_ok=True, parents=True)

PAGES = [
    ("index", "index.html"),
    ("scale", "service-template-scale.html"),
    ("invest", "service-template-invest.html"),
    ("develop", "service-template-develop.html"),
    ("sell", "service-template-sell.html"),
]

VIEWPORTS = [
    ("tablet", 1024, 768),
    ("mobile", 390, 844),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for vp_name, width, height in VIEWPORTS:
            page = await browser.new_page(viewport={"width": width, "height": height})
            for page_name, filename in PAGES:
                url = (BASE / filename).as_uri()
                await page.goto(url, wait_until="networkidle")
                await page.wait_for_timeout(600)

                # Hero area
                hero = await page.query_selector(".hero, .subhero")
                if hero:
                    await hero.scroll_into_view_if_needed()
                    clip = await hero.bounding_box()
                    if clip:
                        await page.screenshot(
                            path=str(OUT / f"{page_name}_{vp_name}_hero.png"),
                            clip={
                                "x": clip["x"],
                                "y": clip["y"],
                                "width": min(clip["width"], width),
                                "height": min(clip["height"], height * 2.5),
                            }
                        )

                # Service page: scroll to hero pane (dcf-pane / site-pane / cross-section)
                if page_name != "index":
                    pane = await page.query_selector(".dcf-pane, .site-pane, .cross-section")
                    if pane:
                        box = await pane.bounding_box()
                        if box:
                            print(f"{page_name} {vp_name}: pane size = {int(box['width'])}x{int(box['height'])}")
                            is_visible = box["width"] > 0 and box["height"] > 0
                            print(f"  visible: {is_visible}")

            await page.close()
        await browser.close()
    print("Done.")

asyncio.run(main())
