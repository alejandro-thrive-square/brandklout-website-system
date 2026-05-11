import asyncio
from pathlib import Path
from playwright.async_api import async_playwright

BASE = Path(__file__).parent / "final-design"
OUT = Path(__file__).parent / "audit-screenshots"
OUT.mkdir(exist_ok=True)

VIEWPORTS = [
    ("tablet", 1024, 768),
    ("mobile", 390, 844),
]

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        for vp_name, width, height in VIEWPORTS:
            page = await browser.new_page(viewport={"width": width, "height": height})
            url = (BASE / "service-template-scale.html").as_uri()
            await page.goto(url, wait_until="networkidle")
            await page.wait_for_timeout(600)

            # Scroll to DCF pane and screenshot it
            dcf = await page.query_selector(".dcf-pane")
            if dcf:
                await dcf.scroll_into_view_if_needed()
                await page.wait_for_timeout(400)
                box = await dcf.bounding_box()
                if box:
                    await page.screenshot(
                        path=str(OUT / f"scale_{vp_name}_dcfpane.png"),
                        clip={
                            "x": max(0, box["x"] - 10),
                            "y": max(0, box["y"] - 10),
                            "width": min(box["width"] + 20, width),
                            "height": min(box["height"] + 20, height),
                        }
                    )
                    print(f"{vp_name}: dcf-pane bbox = {box}")

            await page.close()
        await browser.close()
    print("Done.")

asyncio.run(main())
