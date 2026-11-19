"""Exercise the clam explorer at a project subpath in Chromium."""
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import shutil
import tempfile
import threading
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]


class QuietHandler(SimpleHTTPRequestHandler):
    def log_message(self, *args):
        pass


def main():
    screenshots = ROOT / "browser-checks"
    screenshots.mkdir(exist_ok=True)
    with tempfile.TemporaryDirectory() as temporary:
        shutil.copytree(ROOT / "dist", Path(temporary) / "clamground")
        server = ThreadingHTTPServer(("127.0.0.1", 0), partial(QuietHandler, directory=temporary))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=os.environ.get("CHROMIUM_BIN"))
                page = browser.new_page(viewport={"width": 1280, "height": 1000})
                errors = []
                page.on("pageerror", lambda error: errors.append(str(error)))
                page.goto(f"http://127.0.0.1:{server.server_port}/clamground/")
                page.locator("#region option").first.wait_for(state="attached")
                assert page.locator("#region").input_value()=="Nova Scotia"
                page.locator("#year").select_option("2024")
                assert "21,304,709 kg" in page.locator("#stat-value").inner_text()
                page.locator("#region").select_option("New Brunswick")
                page.locator("#year").select_option("2006")
                assert page.locator("#stat-value").inner_text()=="Unavailable"
                page.locator("#map.leaflet-container").wait_for()
                page.locator("#coast").select_option("digby")
                assert "Digby" in page.locator("#inspect").inner_text()
                page.locator("#map").click(position={"x":110,"y":130})
                page.wait_for_function("document.querySelector('#inspect').textContent.includes('°')")
                assert "°" in page.locator("#inspect").inner_text()
                page.locator("#county").select_option("Digby County")
                assert "11,373" in page.locator("#districts").inner_text()
                with page.expect_download():
                    page.locator("#csv").click()
                page.locator("#region").select_option("Nova Scotia")
                page.locator("#year").select_option("2024")
                page.locator("#year").select_option("2007")
                assert "Withheld by DFO" in page.locator("#stat-value").inner_text()
                page.locator("#year").select_option("2008")
                assert "589,039 kg" in page.locator("#stat-value").inner_text()
                page.screenshot(path=str(screenshots / "desktop.png"),full_page=True)
                page.set_viewport_size({"width":375,"height":812})
                assert page.evaluate("document.documentElement.scrollWidth <= innerWidth")
                page.screenshot(path=str(screenshots / "mobile.png"))
                assert not errors, errors
                browser.close()
            print("Browser checks passed: source snapshots, map selection, landings, 1931 districts, download and mobile layout")
        finally:
            server.shutdown()


if __name__ == "__main__":
    main()
