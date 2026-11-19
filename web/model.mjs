export function measure(row, metric) {
  if (metric === "price") return row.cad !== null && row.kg > 0 ? row.cad / row.kg : null;
  return row[metric];
}

export function statusOf(row, metric) {
  if (measure(row, metric) !== null) return "reported";
  const fields = metric === "price" ? ["kg", "cad"] : [metric];
  if (fields.some(key => row[key + "Status"] === "withheld")) return "withheld";
  if (fields.some(key => row[key] == null)) return "unreported";
  return "undefined";
}

export const statusLabel = {
  reported: "Reported", withheld: "Withheld by DFO (x)",
  unreported: "No published number", undefined: "Undefined at zero landed weight"
};

export function history(rows, region) {
  return rows.filter(row => row.region === region).sort((a,b) => a.year - b.year);
}

function insideRing(x, y, ring) {
  let inside = false;
  for (let i=0, j=ring.length-1; i<ring.length; j=i++) {
    const [x1,y1] = ring[i], [x2,y2] = ring[j];
    if ((y1 > y) !== (y2 > y) && x < (x2-x1)*(y-y1)/(y2-y1)+x1) inside = !inside;
  }
  return inside;
}

export function habitatAt(features, lng, lat) {
  for (const feature of features) {
    const {type, coordinates} = feature.geometry;
    const polygons = type === "Polygon" ? [coordinates] : coordinates;
    const matches = polygons.some(([outer,...holes]) => insideRing(lng,lat,outer) && !holes.some(hole => insideRing(lng,lat,hole)));
    if (matches) return feature.properties.class;
  }
  return null;
}

export function exportRows(rows) {
  return ["Region,Year,Weight_kg,Value_CAD,CAD_per_kg,Weight_status,Value_status", ...rows.map(row => {
    const price = measure(row, "price");
    return ['"'+row.region.replaceAll('"','""')+'"',row.year,row.kg??"",row.cad??"",price?.toFixed(4)??"",statusOf(row,"kg"),statusOf(row,"cad")].join(",");
  })].join("\r\n")+"\r\n";
}

export function comparePeriod(records, region, metric, start, end) {
  const byYear = new Map(history(records, region).map(row => [row.year, row]));
  const rows = Array.from({length: end - start + 1}, (_, i) => {
    const year = start + i;
    return byYear.get(year) ?? {region, year, kg: null, cad: null};
  });
  const first = measure(rows[0], metric);
  const last = measure(rows.at(-1), metric);
  const percent = first > 0 && last !== null ? (last - first) / first : null;
  const reported = rows.filter(row => statusOf(row, metric) === "reported").length;
  return {region, rows, reported, percent};
}
