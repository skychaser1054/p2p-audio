const fs=require('node:fs'),crypto=require('node:crypto');
const files=['player-tools.js','library-upgrade.js','library-upgrade.css','fresh-navigation-sw.js'];
const version=crypto.createHash('sha256').update(files.map(f=>fs.readFileSync(f,'utf8')).join('\n')).digest('hex').slice(0,16);
const file='index.html';let html=fs.readFileSync(file,'utf8');
for(const asset of files.slice(0,3))html=html.replace(new RegExp('(\\./'+asset.replaceAll('.','\\.')+'\\?)[^"\\s>]+','g'),'$1'+version);
fs.writeFileSync(file,html);console.log('Asset version '+version);
