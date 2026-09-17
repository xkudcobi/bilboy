// Geliştirme aracı: tools/add.js içindeki kayıtları data.js sonuna ekler ve kataloğu doğrular.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const dataPath = path.join(root, "data.js");
const addPath = path.join(__dirname, "add.js");

let s = fs.readFileSync(dataPath, "utf8");
if (fs.existsSync(addPath)) {
  const add = fs.readFileSync(addPath, "utf8");
  s = s.replace(/\n\];\s*$/, "\n" + add);
  fs.writeFileSync(dataPath, s);
  fs.unlinkSync(addPath);
}
eval(s.replace("const SHAPES", "globalThis.SHAPES"));
const byCat = SHAPES.reduce((a, x) => ((a[x.cat] = (a[x.cat] || 0) + 1), a), {});
console.log(SHAPES.length, "shapes;", JSON.stringify(byCat));
const ids = SHAPES.map((x) => x.id);
const dupes = ids.filter((x, i) => ids.indexOf(x) !== i);
if (dupes.length) { console.error("DUPLICATE IDS:", dupes); process.exit(1); }
for (const x of SHAPES) {
  if (!(x.realM > 0) || !(x.nW > 0) || !(x.nH > 0) || !x.path || !x.cat) { console.error("BAD:", x.id); process.exit(1); }
}
