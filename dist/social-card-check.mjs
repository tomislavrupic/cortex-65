import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base='https://tomislavrupic.github.io/cortex-65/';
const manifest=JSON.parse(await readFile(new URL('assets/marketing/manifest.json',import.meta.url),'utf8'));
const asset='assets/marketing/'+manifest.activeSocialAsset,png=await readFile(new URL(asset,import.meta.url));
const width=png.readUInt32BE(16),height=png.readUInt32BE(20);assert.equal(width,2*height);assert.ok(png.length<5*1024*1024);
for(const entry of manifest.assets){const bytes=await readFile(new URL('assets/marketing/'+entry.asset,import.meta.url));assert.equal(bytes.toString('hex',0,8),'89504e470d0a1a0a');assert.equal(bytes.readUInt32BE(16),entry.width);assert.equal(bytes.readUInt32BE(20),entry.height);assert.equal(createHash('sha256').update(bytes).digest('hex'),entry.sha256);}
for(const file of ['index.html','downloads.html']){
 const html=await readFile(new URL(file,import.meta.url),'utf8'),tags=new Map();
 for(const match of html.matchAll(/<meta\s+([^>]+)>/g)){const attributes=Object.fromEntries([...match[1].matchAll(/([\w:]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));const key=attributes.property||attributes.name;if(key){assert.ok(!tags.has(key),'unique '+key);tags.set(key,attributes.content);}}
 assert.equal(tags.get('og:image'),base+asset);assert.equal(tags.get('twitter:image'),base+asset);assert.equal(tags.get('twitter:card'),'summary_large_image');assert.equal(Number(tags.get('og:image:width')),width);assert.equal(Number(tags.get('og:image:height')),height);assert.ok(tags.get('twitter:image:alt').includes('cyborg'));
 if(file==='downloads.html'){assert.ok(html.includes('src="assets/marketing/'+manifest.activePosterAsset+'"'));for(const entry of manifest.assets)assert.ok(html.includes('href="assets/marketing/'+entry.asset+'"'));assert.ok(html.includes('CORTEX-65-X-landscape.png'));}
}
console.log(JSON.stringify({ok:true,pages:2,dimensions:[width,height],socialBytes:png.length,posterOriginal:true,downloadableArtwork:true,publicAbsoluteImage:true,largeImageCard:true}));
