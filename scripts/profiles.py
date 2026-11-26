"""Publish the province and aggregate series in DFO's commercial clam landings release."""
from html import escape
import json
from urllib.parse import urlencode
from result_pages import link, publish, slug, table


def amount(row, key):
    if row[key] is None:
        return "Withheld (x)" if row.get(key + "Status") == "withheld" else "Unreported"
    return f"{row[key]:,}"


def publish_profiles(stage, tool):
    data = json.loads((stage / "data/records.json").read_text())
    regions = {}
    for row in sorted(data["rows"], key=lambda r: r["year"], reverse=True):
        regions.setdefault(row["region"], []).append(row)
    records = []
    for region, history in regions.items():
        latest = history[0]
        if not any(r["kg"] is not None or r["cad"] is not None for r in history):
            continue
        name = "Atlantic Canada" if region == "Atlantic" else region
        title = f"Commercial clam landings in {name}"
        intro = f"DFO’s annual series for {name} covers {history[-1]['year']} to {latest['year']}."
        if latest["kg"] is not None:
            intro += f" The {latest['year']} release reports {amount(latest, 'kg')} kg of clams landed."
        rows = [(r["year"], amount(r, "kg"), amount(r, "cad")) for r in history]
        body = table("Commercial landings reported by DFO", ["Year", "Live-weight equivalent (kg)", "Landed value (nominal CAD)"], rows)
        body += ('<p>The Clams category combines species. Geography follows the place of landing. '
                 'Canada and Atlantic totals overlap the provincial series. A confidentiality flag is shown as withheld.</p>')
        body += '<p>' + link(tool["url"] + "?" + urlencode({"region": region}) + "#landings", "Compare this series with another region") + '</p>'
        body += (f'<h2>Source and coverage</h2><p>Snapshot retrieved {escape(data["retrieved"])}. '
                 + link(data["landingsUrl"], "Download DFO’s commercial seafisheries landings CSV") + '</p>')
        if region == "Nova Scotia":
            body += '<p>' + link('/clamcounter/', 'Compare dated Halifax-area restaurant prices for clams and chips') + '</p>'
        records.append((slug(region), name, title, intro, body))
    publish(stage, tool, "landings", "Canadian commercial clam landings by province and region",
            "Choose a published series to see annual landed weight and value, including withheld observations.", records)
