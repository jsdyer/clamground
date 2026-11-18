import {exportRows,habitatAt,history,measure} from "./model.mjs";
const el = id => document.getElementById(id);
const number = new Intl.NumberFormat("en-CA");
const priceFormat = new Intl.NumberFormat("en-CA",{minimumFractionDigits:2,maximumFractionDigits:2});
const coasts = {
  digby:[[44.52,-65.78],10,"Digby"],
  halifax:[[44.64,-63.55],10,"Halifax"],
  fundy:[[45.29,-64.22],9,"Minas Basin"],
  south:[[44.35,-64.30],9,"Lunenburg"],
  nb:[[45.09,-66.94],9,"Passamaquoddy Bay"],
  breton:[[46.15,-59.98],8,"Sydney"]
};
const colours = {"Suitable and Validated":"#167a6c","Suitable":"#e6b151","Not Suitable":"#a4b4aa"};
const explanations = {
  "Suitable and Validated":"Suitable habitat within a sector where DFO found historical evidence of harvesting.",
  "Suitable":"DFO modelled suitable seabed and depth here.",
  "Not Suitable":"DFO classed this seabed as unsuitable.",
};
async function read(file) {
  const response = await fetch("./data/"+file);
  if (!response.ok) throw Error("Snapshot unavailable");
  return response.json();
}
function makeMap(shapes,land) {
  const map = L.map("map",{preferCanvas:true,scrollWheelZoom:false,minZoom:6,maxZoom:11,maxBounds:[[40,-73],[51,-51]],maxBoundsViscosity:.8});
  const extent=[[43.2,-67.4],[46.9,-59.1]];
  map.fitBounds(extent);
  L.geoJSON(land,{interactive:false,style:{stroke:true,color:"#91a497",weight:1,fillColor:"#f1ecdc",fillOpacity:1}}).addTo(map);
  for(const feature of shapes.features) {
    L.geoJSON(feature,{interactive:false,style:{stroke:false,fillColor:colours[feature.properties.class],fillOpacity:.93}}).addTo(map);
  }
  map.attributionControl.addAttribution('Habitat © Fisheries and Oceans Canada · Land: Natural Earth');
  const labels = L.layerGroup().addTo(map);
  function addLabels(){
    labels.clearLayers();
    for (const [, [pos,,name]] of Object.entries(coasts)) {
      if(map.getZoom()<7 && (name==="Lunenburg"||name==="Digby")) continue;
      L.circleMarker(pos,{radius:2.5,weight:1,color:"#132f29",fillOpacity:1,interactive:false}).bindTooltip(name,{permanent:true,direction:"right",className:"place",offset:[4,0]}).addTo(labels);
    }
  }
  map.on("zoomend",addLabels);addLabels();
  let pin;
  function inspect(pos) {
    const cls=habitatAt(shapes.features,pos.lng,pos.lat);
    el("inspect").textContent=pos.lat.toFixed(3)+"°, "+pos.lng.toFixed(3)+"° · "+(cls?cls+". "+explanations[cls]:"Outside the modelled polygons at this display scale.");
    if(pin) pin.remove();
    pin=L.circleMarker(pos,{radius:6,color:"#211f16",weight:2,fillColor:"#fff",fillOpacity:.2,interactive:false}).addTo(map);
  }
  map.on("click",event=>inspect(event.latlng));
  el("coast").onchange=()=>{
    const coast=coasts[el("coast").value];
    if(pin){pin.remove();pin=null;}
    if(coast){map.setView(coast[0],coast[1]);el("inspect").textContent="Viewing "+coast[2]+". Select a point in the water to read the model.";}
    else{map.fitBounds(extent);el("inspect").textContent="Select a point to inspect its habitat class.";}
  };
}

function formatted(value,metric) {
  if(value===null) return "Unavailable";
  if(metric==="cad") return "$"+number.format(value);
  if(metric==="price") return "$"+priceFormat.format(value)+"/kg";
  return number.format(value)+" kg";
}
function makeHistory(data) {
  for (const region of [...new Set(data.rows.map(r=>r.region))].sort()) el("region").add(new Option(region,region));
  el("region").value="Nova Scotia";
  let rows;
  function render() {
    const metric=el("metric").value;
    const chosen=rows.find(r=>String(r.year)===el("year").value);
    el("stat-label").textContent=chosen.region+" · "+chosen.year+" · "+el("metric").selectedOptions[0].textContent;
    el("stat-value").textContent=formatted(measure(chosen,metric),metric);
    const extra=["kg","cad","price"].filter(m=>m!==metric);
    el("other-measure").textContent=extra.map(m=>formatted(measure(chosen,m),m)).join(" · ");
    const max=Math.max(1,...rows.map(row=>measure(row,metric)??0));
    el("chart").replaceChildren(...rows.map(row=>{
      const val=measure(row,metric), btn=document.createElement("button");
      btn.type="button"; btn.className="yearbar"+(val===null?" missing":"");
      btn.setAttribute("aria-label",row.year+" · "+formatted(val,metric));btn.title=btn.getAttribute("aria-label");
      btn.setAttribute("aria-pressed",String(row.year===chosen.year));
      const bar=document.createElement("span");bar.style.setProperty("--height",(val??0)/max*100+"%");btn.append(bar);
      btn.onclick=()=>{el("year").value=row.year;render();el("chart").querySelector('[aria-pressed="true"]').focus({preventScroll:true});};
      return btn;
    }));
    el("first").textContent=rows[0].year;el("last").textContent=rows.at(-1).year;
  }
  function regionChanged() {
    rows=history(data.rows,el("region").value);
    const prior=Number(el("year").value);
    el("year").replaceChildren(...rows.map(r=>new Option(r.year,r.year)));
    el("year").value=rows.some(r=>r.year===prior)?prior:rows.at(-1).year;
    el("history").replaceChildren(...[...rows].reverse().map(row=>{
      const tr=document.createElement("tr");
      const dollar=measure(row,"price");
      for(const v of [row.year,row.kg===null?"Unavailable":number.format(row.kg),row.cad===null?"Unavailable":number.format(row.cad),dollar===null?"Unavailable":priceFormat.format(dollar)]){
        const cell=document.createElement("td");cell.textContent=v;tr.append(cell);
      }
      return tr;
    }));
    render();
  }
  el("region").onchange=regionChanged;el("year").onchange=render;el("metric").onchange=render;
  el("csv").onclick=()=>{
    const url=URL.createObjectURL(new Blob([exportRows(rows)],{type:"text/csv;charset=utf-8"}));
    const link=document.createElement("a");link.href=url;link.download="clam-landings-"+el("region").value.toLowerCase().replaceAll(" ","-")+".csv";
    document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  regionChanged();
}
function makeArchive(data) {
  const county=el("county");
  for(const name of Object.keys(data.counties)) county.add(new Option(name,name));
  function display() {
    el("districts").replaceChildren(...data.counties[county.value].map(([name,,...figures])=>{
      const tr=document.createElement("tr");
      for(const value of [name,...figures]){
        const td=document.createElement("td");
        td.textContent=typeof value==="number"?number.format(value):value??"—";
        tr.append(td);
      }
      return tr;
    }));
  }
  county.onchange=display;display();
}
const result=await Promise.allSettled([
  read("districts-1931.json").then(makeArchive),
  Promise.all([read("habitat.json"),read("land.json")]).then(([shapes,land])=>makeMap(shapes,land)),
  read("records.json").then(data=>{
    makeHistory(data);
    el("retrieved").textContent="Data retrieved "+data.retrieved+" · Landings cover "+data.firstYear+"–"+data.lastYear+".";
    el("status").textContent="Data retrieved "+data.retrieved+" · "+data.rows.length+" landings records · "+data.firstYear+"–"+data.lastYear;
  })
]);
if(result.some(x=>x.status==="rejected")) el("status").textContent+=" · A section could not load. Reload or use the source links.";
