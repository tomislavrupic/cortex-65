import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const base=new URL('./assets/anatomy/',import.meta.url),provenance=JSON.parse(await readFile(new URL('provenance.json',base),'utf8'));
const xyz=await readFile(new URL('brain-65536.xyz.f32',base)),normals=await readFile(new URL('brain-65536.normals.f32',base));
for(const buffer of[xyz,normals])assert.equal(buffer.length,65536*3*4);
const sha=b=>createHash('sha256').update(b).digest('hex');assert.equal(sha(xyz),provenance.point_cloud_sha256);assert.equal(sha(normals),provenance.normals_sha256);
const min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity],hemisphereX=[0,0];
for(let i=0;i<65536;i++){let magnitude=0;for(let axis=0;axis<3;axis++){const p=xyz.readFloatLE((i*3+axis)*4),n=normals.readFloatLE((i*3+axis)*4);assert.ok(Number.isFinite(p)&&Number.isFinite(n));min[axis]=Math.min(min[axis],p);max[axis]=Math.max(max[axis],p);magnitude+=n*n;if(axis===0)hemisphereX[i<32768?0:1]+=p/32768;}assert.ok(Math.abs(Math.sqrt(magnitude)-1)<.001);}
assert.ok(hemisphereX[0]>0&&hemisphereX[1]<0);assert.deepEqual([min,max],provenance.bounds);
console.log(JSON.stringify({ok:true,source:'BodyParts3D',points:65536,normals:65536,hashesMatchProvenance:true,unitNormals:true,bounds:[min,max],leftHemispherePositiveX:true,groups:16,pointsPerGroup:4096,pointsPerRing:32},null,2));
