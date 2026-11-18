"""Import DFO's habitat polygons and the current English commercial landings CSV."""
import csv
from datetime import date, timezone, datetime
from io import StringIO
import json
from pathlib import Path
import re
from tempfile import TemporaryDirectory
from time import sleep
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode, urlsplit
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
CATALOG = "https://open.canada.ca/data/api/3/action/package_show?id=6e16f703-9c57-46c9-9194-6573398c17e6"
LAYER = "https://egisp.dfo-mpo.gc.ca/arcgis/rest/services/open_data_donnees_ouvertes/soft_shelled_clam_habitat_suitability/MapServer/0"
CLASSES = {"Suitable", "Not Suitable", "Suitable and Validated"}


def fetch(url):
    for attempt in range(3):
        try:
            with urlopen(Request(url, headers={"User-Agent": "CoolCode Clam Grounds/1.0"}), timeout=75) as response:
                return response.read()
        except HTTPError as exc:
            if exc.code < 500 or attempt == 2:
                raise
        except (URLError, TimeoutError):
            if attempt == 2:
                raise
        sleep(2 ** attempt)


def csv_url(catalogue):
    candidates = []
    for res in catalogue["result"]["resources"]:
        name = res.get("name") or ""
        period = re.search(r"(\d{4})\s*[-–]\s*(\d{4})", name)
        if period and "commercial seafisheries landings" in name.lower() and name.upper().endswith("EN") and res.get("format", "").upper() == "CSV":
            url = res["url"]
            if urlsplit(url).scheme == "https" and urlsplit(url).hostname.endswith(".dfo-mpo.gc.ca"):
                candidates.append((int(period[2]), url))
    if not candidates:
        raise ValueError("Could not identify the DFO English landings release")
    return max(candidates)[1]


def amount(raw):
    value = raw.strip()
    if value.lower() in {"x", "..", "...", ""}:
        return None
    if not re.fullmatch(r"(\d+|\d{1,3}(,\d{3})+)", value):
        raise ValueError(f"Unrecognized amount: {value!r}")
    return int(value.replace(",", ""))


def landings(raw):
    try:
        source = raw.decode("utf-8-sig")
    except UnicodeDecodeError:
        source = raw.decode("cp1252")
    result = {}
    for record in csv.DictReader(StringIO(source)):
        if record["Species"].strip() != "Clams":
            continue
        year, region = int(record["Year"]), record["Province"].strip()
        if (region, year) in result or not region or not 1900 <= year <= date.today().year:
            raise ValueError("Unexpected duplicate or invalid clam landing record")
        result[region, year] = {"year": year, "region": region, "kg": amount(record["Quantity (kgs)"]), "cad": amount(record["Value (CAD)"])}
    if sum(x["region"] == "Nova Scotia" for x in result.values()) < 30:
        raise ValueError("The downloaded file lacks the Nova Scotia history")
    return [result[k] for k in sorted(result)]


def query(**params):
    response = json.loads(fetch(LAYER+"/query?"+urlencode(params)))
    if "error" in response:
        raise ValueError(response["error"])
    return response


def habitat():
    ids = query(f="json",where="1=1",returnIdsOnly="true")["objectIds"]
    if not ids or len(ids) != len(set(ids)):
        raise ValueError("Missing or repeated habitat object IDs")
    shapes = []
    for oid in sorted(ids):
        result = query(f="geojson",where=f"OBJECTID={int(oid)}",outFields="Habitat_Su,OBJECTID",returnGeometry="true",outSR=4326,geometryPrecision=4,maxAllowableOffset=0.003)
        if len(result["features"]) != 1 or result.get("exceededTransferLimit"):
            raise ValueError("Incomplete DFO habitat geometry")
        feature = result["features"][0]
        g = feature["geometry"]
        if feature["properties"]["OBJECTID"] != oid or g["type"] not in {"MultiPolygon","Polygon"}:
            raise ValueError("Unexpected habitat record")
        polygons = g["coordinates"] if g["type"]=="MultiPolygon" else [g["coordinates"]]
        if not polygons or any(not poly or any(len(ring)<4 or ring[0]!=ring[-1] for ring in poly) for poly in polygons):
            raise ValueError("Empty or incomplete habitat polygon")
        shapes.append({"type":"Feature", "properties":{"class":feature["properties"]["Habitat_Su"]}, "geometry":g})
    if {s["properties"]["class"] for s in shapes} != CLASSES:
        raise ValueError("Habitat classes changed")
    return {"type":"FeatureCollection","features":shapes}


def main():
    source = csv_url(json.loads(fetch(CATALOG)))
    rows = landings(fetch(source))
    shapes = habitat()
    years = [r["year"] for r in rows]
    record = {"retrieved":datetime.now(timezone.utc).date().isoformat(),"firstYear":str(min(years)),"lastYear":str(max(years)),"landingsUrl":source,"habitatUrl":LAYER,"rows":rows}
    folder=ROOT/"web/data"
    with TemporaryDirectory(dir=folder) as tmp:
        files = [("habitat.json", shapes), ("records.json",record)]
        for name,obj in files:
            (Path(tmp)/name).write_text(json.dumps(obj,ensure_ascii=False,separators=(",",":"))+"\n",encoding="utf-8")
        for name,_ in files:
            (Path(tmp)/name).replace(folder/name)
    print(f"Verified {len(shapes['features'])} DFO habitat features and {len(rows)} landings records, {min(years)}–{max(years)}.")


if __name__ == "__main__":
    main()
