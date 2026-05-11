import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots"
OUT.mkdir(exist_ok=True)

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
                # Hero only screenshot
                hero = await page.query_selector(".hero, .subhero")
                if hero:
                    clip = await hero.bounding_box()
                    if clip:
                        await page.screenshot(
                            path=str(OUT / f"{page_name}_{vp_name}_hero.png"),
                            clip={
                                "x": clip["x"],
                                "y": clip["y"],
                                "width": min(clip["width"], width),
                                "height": min(clip["height"], height * 2),
                            }
                        )
                # Full page screenshot
                await page.screenshot(
                    path=str(OUT / f"{page_name}_{vp_name}_full.png"),
                    full_page=False
                )
            await page.close()
        await browser.close()
    print("Done. Screenshots saved to:", OUT)

asyncio.run(main())
