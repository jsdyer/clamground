import assert from "node:assert/strict";
import test from "node:test";
import {measure,history,exportRows,habitatAt} from "../web/model.mjs";
const rows=[{year:2024,region:"Nova Scotia",kg:4,cad:12},{year:2023,region:"Nova Scotia",kg:null,cad:null},{year:2021,region:"Canada",kg:0,cad:0}];
test("province histories, totals and suppressed amounts",()=>{
 assert.deepEqual(history(rows,"Nova Scotia").map(r=>r.year),[2023,2024]);
 assert.equal(measure(rows[0],"price"),3);assert.equal(measure(rows[1],"price"),null);assert.equal(measure(rows[2],"price"),null);
 assert.match(exportRows([rows[1]]),/2023,,,\r\n/);
});
test("map selection respects holes and outer coverage",()=>{
 const geom={type:"Polygon",coordinates:[[[0,0],[4,0],[4,4],[0,4],[0,0]],[[1,1],[2,1],[2,2],[1,2],[1,1]]]};
 const f=[{geometry:geom,properties:{class:"Suitable"}}];
 assert.equal(habitatAt(f,.5,.5),"Suitable");assert.equal(habitatAt(f,1.5,1.5),null);assert.equal(habitatAt(f,9,9),null);
});
