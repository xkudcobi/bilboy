const fs=require("fs");let s=fs.readFileSync("data.js","utf8");
function setPath(id, newPath){const re=new RegExp(`(id: "${id}"[\s\S]*?path: )"[\s\S]*?",\n(\s*fact:)`);if(!re.test(s))throw new Error("no "+id);s=s.replace(re,`$1${JSON.stringify(newPath)},\n$2`);}
setPath("trex","M0 100 Q60 70 140 90 L200 100 Q240 60 300 60 Q340 60 360 40 L380 20 Q400 0 440 6 L480 30 L470 60 L440 70 L400 70 L390 90 Q380 120 340 130 L330 150 L350 180 L336 218 L306 218 L318 180 L300 150 L260 130 Q220 130 200 120 L212 150 L222 218 L192 218 L180 150 L160 120 Q80 120 0 110 Z M330 90 L346 96 L342 104 L326 100 Z");
setPath("kangaroo","M60 30 Q66 10 84 10 L90 0 L96 4 L94 14 L110 20 L108 32 L94 36 L86 50 Q100 70 92 100 L100 120 L128 124 L128 134 L86 134 L74 116 L66 118 L64 150 H50 L48 118 Q40 112 36 100 L10 140 L0 134 L30 84 Q34 60 46 44 Z");
fs.writeFileSync("data.js",s);console.log("ok");
