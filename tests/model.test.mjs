import assert from "node:assert/strict";
import test from "node:test";
import {measure,statusOf,history,exportRows,habitatAt} from "../web/model.mjs";
const rows=[{year:2024,region:"Nova Scotia",kg:4,cad:12},{year:2023,region:"Nova Scotia",kg:null,cad:null},{year:2021,region:"Canada",kg:0,cad:0}];
test("province histories, totals and suppressed amounts",()=>{
 assert.deepEqual(history(rows,"Nova Scotia").map(r=>r.year),[2023,2024]);
 assert.equal(measure(rows[0],"price"),3);assert.equal(measure(rows[1],"price"),null);assert.equal(measure(rows[2],"price"),null);
 assert.match(exportRows([rows[1]]),/2023,,,,unreported,unreported/);
});
test("map selection respects holes and outer coverage",()=>{
 const geom={type:"Polygon",coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]};
 const f=[{geometry:geom,properties:{class:"Suitable"}}];
 assert.equal(habitatAt(f,.5,.5),"Suitable");assert.equal(habitatAt(f,1.5,1.5),null);assert.equal(habitatAt(f,9,9),null);
});

test("withheld differs from zero and follows the numerator of a unit price",()=>{
 const row={kg:6,cad:null,cadStatus:"withheld"};
 assert.equal(statusOf(row,"kg"),"reported");
 assert.equal(statusOf(row,"price"),"withheld");
 assert.equal(statusOf({kg:0,cad:0},"price"),"undefined");
});

test("paired intervals preserve unmatched years, confidential endpoints and zero baselines", async () => {
  const {comparePeriod} = await import("../web/model.mjs");
  const records = [{region:"A",year:2000,kg:2,cad:4},{region:"A",year:2002,kg:0,cad:0},
    {region:"A",year:2003,kg:null,cad:null,kgStatus:"withheld",cadStatus:"withheld"}];
  const period = comparePeriod(records,"A","kg",2000,2002);
  assert.equal(period.percent,-1);
  assert.equal(period.reported,2);
  assert.equal(statusOf(period.rows[1],"kg"),"unreported");
  assert.equal(comparePeriod(records,"A","kg",2002,2003).percent,null);
  assert.equal(comparePeriod(records,"A","price",2000,2002).reported,1);
  assert.equal(comparePeriod(records,"A","kg",2000,2003).percent,null);
});
