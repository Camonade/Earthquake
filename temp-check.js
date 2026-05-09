const fs = require('fs');
const path = require('path');
const data = JSON.parse(fs.readFileSync('earthquake-heritage.json', 'utf8'));
const files = fs.readdirSync('images');
const names = files.map(f => f.replace(/\.(png|jpg|jpeg)$/i, ''));
console.log('files', files.length);
const available = new Set(names);
const localMap = {
  tanlu_fault: ['images/郯庐断裂带.png', 'images/郯庐断裂带2.png'],
  tancheng_1668: ['images/熊耳山大裂谷.png'],
  jiji_1999_canyon: ['images/大安溪峡谷.png'],
  jiuzhaigou_waterfall: ['images/九寨沟熊猫海瀑布.png'],
  landslide_dam_lakes: ['images/小南海堰塞湖.png', 'images/党家岔堰塞湖.png'],
  beijing_sand_liquefaction: ['images/沙火山.png'],
  okavango_delta: ['images/奥卡万戈三角洲.png'],
  haiyuan_guliu: ['images/海原地震古柳撕裂.png'],
  tianzhu_mountain: ['images/天柱山双乳峰.png'],
  east_african_rift: ['images/东非大裂谷.png'],
  huashan_west_peak: ['images/华山西峰.png'],
  weihe_valley: ['images/渭河谷地.png']
};
const missing = [];
for (const s of data) {
  const id = s.id;
  const name = s.name;
  if (localMap[id]) {
    const all = localMap[id].map(u => path.basename(u).replace(/\.(png|jpg|jpeg)$/i, ''));
    if (!all.every(n => available.has(n))) missing.push({ id, name, missingFiles: all.filter(n => !available.has(n)) });
    continue;
  }
  const candidates = [name, id];
  if (!candidates.some(x => available.has(x))) missing.push({ id, name });
}
console.log(JSON.stringify(missing, null, 2));
