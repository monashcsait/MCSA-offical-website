// Run from the official checkout: node scripts/export-alumni.cjs ../MCSA-website-provisional-
const fs=require('node:fs');
const path=require('node:path');
require('../assets/alumni.js');
const source=path.resolve(__dirname,'..');
if(!process.argv[2])throw new Error('Provide the provisional checkout path');
const destination=path.resolve(process.argv[2]);
if(destination===source)throw new Error('Destination must be the provisional checkout');
const d=JSON.parse(fs.readFileSync(path.join(source,'content/departments/alumni.json')));
for(const lang of ['zh','en']){
 const suffix=lang==='en'?'-en':'';
 const target=path.join(destination,`department-alumni${suffix}.html`);
 let shell=fs.readFileSync(target,'utf8');
 if(!/<main\b[^>]*>[\s\S]*?<\/main>/.test(shell))throw new Error('Missing static main element');
 if(!shell.includes('href="assets/alumni.css"'))shell=shell.replace('</head>','<link rel="stylesheet" href="assets/alumni.css"></head>');
 const article=globalThis.MCSAAlumni.render(d,lang).replace('href="recruitment.html"',`href="departments${suffix}.html"`);
 fs.writeFileSync(target,shell.replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/,(_,a,b)=>a+article+b));
}
for(const file of ['alumni.json','alumni-originals.json'])fs.copyFileSync(path.join(source,'content/departments',file),path.join(destination,'content/departments',file));
fs.copyFileSync(path.join(source,'assets/alumni.css'),path.join(destination,'assets/alumni.css'));
const dir='images/departments/alumni';fs.mkdirSync(path.join(destination,dir),{recursive:true});
for(const name of fs.readdirSync(path.join(source,dir)))fs.copyFileSync(path.join(source,dir,name),path.join(destination,dir,name));
console.log('Exported Alumni Chinese/English pages, styles, content and unchanged supplied assets.');
