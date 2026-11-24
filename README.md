# Clam Grounds

[Explore the map and landings](https://coolcode.ca/clamground/). Choose a stretch of the Maritimes coast to explore DFO's soft-shell clam habitat model. Then choose a province, measure and year to compare the weight and value of Canada’s commercial clam landings.

<!-- coolcode:guide -->
Compare Nova Scotia and New Brunswick over the same years to see where DFO published landings or marked them x for confidentiality. For a local historical view, choose a county in the 1931 returns and check its barrels or canned cases against the linked scan of page 84.
<!-- /coolcode:guide -->

## Reading the habitat model

The DFO Maritimes region classified soft substrates and depths from 0 to 70 metres. A suitable polygon in a validated coastal sector means historical harvesting or enforcement records established clam presence somewhere in that sector. Unclassified space is left blank. The map uses a regional display copy generalized at 0.003 degrees; its edges are approximate. The official [shellfish closures map](https://www.dfo-mpo.gc.ca/shellfish-mollusques/cssp-map-eng.htm) provides harvesting closure information. Check applicable rules and advisories before harvesting.

The DFO layer and a clipped Natural Earth land outline load with the site, so exploring the map sends no coordinates to a map provider. Click a point to inspect its class. Use the coast menu and map zoom controls to navigate.

## Reading the landings

The DFO seafisheries CSV reports all commercially landed species grouped as **Clams** in kilograms and nominal Canadian dollars. The analysis includes provincial rows plus national and Atlantic totals as separate series. Adding these totals to the individual provinces would double-count catch. Value per kilogram is the published value divided by landed weight, not a retail clam price. DFO uses province of landing and kilograms of live-weight equivalent. A hatched marker retains the source’s confidentiality flag (x). DFO suppresses the affected quantity or value to meet confidentiality requirements. Its dictionary supplies no per-cell threshold or explanation. Both Nova Scotia amounts in 2007 are flagged, so landed value per kilogram is also unavailable. [DFO data dictionary (CSV)](https://api-proxy.edh-cde.dfo-mpo.gc.ca/catalogue/records/6e16f703-9c57-46c9-9194-6573398c17e6/attachments/Data%20Dictionary.csv) A reported zero and a missing figure are distinct. CSV exports keep the numeric cells empty where appropriate and carry a separate status for weight and value. The area selected on the habitat map has no effect on province-wide statistics.

The annual release does not disaggregate ports, fleets or clam species. DFO documents that vessel losses reduced offshore harvesting capacity in 2007 and 2008 and that the fleet landed product in Grand Bank, Newfoundland and Labrador. For 2008, the offshore fishing-ground table gives 19,336 tonnes from Banquereau, while the provincial table gives 589,039 kg of all commercial clams landed in Nova Scotia. The difference illustrates how a bank and a landing province describe different parts of the trip. The table alone cannot attribute the Nova Scotia series or its 2015 increase to a particular event. [DFO offshore clam management plan](https://publications.gc.ca/collections/collection_2021/mpo-dfo/Fs104-40-2014-eng.pdf) · [DFO fishing-ground figures, Table 1](https://publications.gc.ca/collections/collection_2013/mpo-dfo/Fs70-5-2011-052-eng.pdf)

Select a second province or published total and a baseline year for a side-by-side history. The end year and measure come from the chart. The table compares endpoint changes and counts years with a usable figure. The annual comparison shows which years were withheld, missing or undefined at zero weight. A zero baseline or missing endpoint leaves the percentage unavailable. Download both series for the exact period with separate weight and value flags.

## The 1931 fishing districts

Choose among ten counties from Guysborough to Kings to read all 25 quantity rows on printed page 84 of Table I of the Dominion Bureau of Statistics’ *Fisheries Statistics, 1931*. The [original scan](https://publications.gc.ca/collections/collection_2018/statcan/24-201/CS24-201-1931-eng.pdf#page=87) is linked at printed page 84 (PDF page 87). The [single-page facsimile](https://coolcode.ca/clamground/data/fisheries-1931-p84.webp) opens alongside the transcribed figures. Queens reported 468 barrels landed, 173 barrels sold fresh and 295 cases canned. Hants and Kings have dashes throughout. The structured download preserves the source row numbers, barrel and case units, dashes and county totals. These archive records stay separate from the modern province-level series.

## Sources and refresh

- [DFO soft-shell clam habitat suitability](https://egisp.dfo-mpo.gc.ca/arcgis/rest/services/open_data_donnees_ouvertes/soft_shelled_clam_habitat_suitability/MapServer).
- [DFO commercial landings and supporting data dictionary](https://open.canada.ca/data/en/dataset/6e16f703-9c57-46c9-9194-6573398c17e6).
- [Natural Earth 1:50m land](https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/) supplies the regional orientation layer, clipped to the Maritimes. Leaflet is distributed under the BSD 2-clause licence in web/vendor/LICENSE.

The monthly GitHub Action resolves the latest English CSV from the federal catalogue, verifies the habitat classes and landing history, and publishes a complete snapshot. Both downloads must succeed before replacing the previous edition. The retrieval date records the download. The landings coverage ends in the last year supplied by DFO. Run `python3 scripts/refresh.py` to update the data, `python3 -m unittest discover -s tests`, `node --test tests/*.test.mjs` and `python3 scripts/build.py` to check and build the static site. All interactive selections stay in the browser.

<!-- schedule-reliability -->
## Schedule reliability

Public GitHub repositories can have scheduled workflows disabled after 60 days of inactivity. A separate weekly [schedule guard](.github/workflows/schedule-guard.yml) calls GitHub's enable-workflow API for an explicit list of refresh workflows and itself. It can restore workflows disabled for inactivity, preserves manually disabled workflows, and runs independently of collection failures.

This is an interim mitigation, not a scheduling guarantee: GitHub does not document active-workflow renewal as a permanent exemption, and scheduled runs can be delayed or dropped. A scheduler on our own Linux server is the planned independent trigger. The guard does not collect data, create dummy commits, or change source/check timestamps; successful collection and published data freshness still need monitoring.
<!-- /schedule-reliability -->
