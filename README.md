# Clam Grounds

[Explore the map and landings](https://coolcode.ca/clamground/). Choose a stretch of the Maritimes coast to explore DFO's soft-shell clam habitat model. Then choose a province, measure and year to compare the weight and value of Canada’s commercial clam landings.

<!-- coolcode:guide -->
Try Digby on the habitat map, then compare Nova Scotia’s landed weight and value per kilogram. The map describes soft-shell clams, while the commercial figures combine species reported as Clams. The 1931 district returns show how many barrels went to the fresh market and how many cases were canned in Halifax and Digby counties.
<!-- /coolcode:guide -->

## Reading the habitat model

The DFO Maritimes region classified soft substrates and depths from 0 to 70 metres. A suitable polygon in a validated coastal sector means historical harvesting or enforcement records established clam presence somewhere in that sector. Unclassified space is left blank. The map uses a regional display copy generalized at 0.003 degrees; its edges are approximate. The official [shellfish closures map](https://www.dfo-mpo.gc.ca/shellfish-mollusques/cssp-map-eng.htm) provides harvesting closure information. Check applicable rules and advisories before harvesting.

The DFO layer and a clipped Natural Earth land outline load with the site, so exploring the map sends no coordinates to a map provider. Click a point to inspect its class. Use the coast menu and map zoom controls to navigate.

## Reading the landings

The DFO seafisheries CSV reports all commercially landed species grouped as **Clams** in kilograms and nominal Canadian dollars. The analysis includes provincial rows plus national and Atlantic totals as separate series. Adding these totals to the individual provinces would double-count catch. Value per kilogram is the published value divided by landed weight, not a retail clam price. Suppressed or missing amounts stay unavailable in the chart and blank in CSV exports. The area selected on the habitat map has no effect on province-wide statistics.

## The 1931 fishing districts

Switch between Halifax and Digby counties to read eight quantity rows transcribed from Table I of the Dominion Bureau of Statistics’ *Fisheries Statistics, 1931*. The [original scan](https://publications.gc.ca/collections/collection_2018/statcan/24-201/CS24-201-1931-eng.pdf#page=87) is linked at printed page 84 (PDF page 87). The structured download preserves the source row numbers, barrel and case units, dashes and county totals. These archive records stay separate from the modern province-level series.

## Sources and refresh

- [DFO soft-shell clam habitat suitability](https://egisp.dfo-mpo.gc.ca/arcgis/rest/services/open_data_donnees_ouvertes/soft_shelled_clam_habitat_suitability/MapServer).
- [DFO commercial landings and supporting data dictionary](https://open.canada.ca/data/en/dataset/6e16f703-9c57-46c9-9194-6573398c17e6).
- [Natural Earth 1:50m land](https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-land/) supplies the regional orientation layer, clipped to the Maritimes. Leaflet is distributed under the BSD 2-clause licence in web/vendor/LICENSE.

The monthly GitHub Action resolves the latest English CSV from the federal catalogue, verifies the habitat classes and landing history, and publishes a complete snapshot. Both downloads must succeed before replacing the previous edition. The retrieval date records the download. The landings coverage ends in the last year supplied by DFO. Run `python3 scripts/refresh.py` to update the data, `python3 -m unittest discover -s tests`, `node --test tests/*.test.mjs` and `python3 scripts/build.py` to check and build the static site. All interactive selections stay in the browser.
