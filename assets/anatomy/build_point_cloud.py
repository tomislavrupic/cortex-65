"""Derive 65,536 surface samples from the licensed BodyParts3D hemispheres.
No procedural replacement folds: barycentric, area-weighted mesh sampling.
"""
from pathlib import Path
import csv, hashlib, json, zipfile
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt

ROOT=Path(__file__).resolve().parent
SOURCE=ROOT/'source'
archive=SOURCE/'partof_BP3D_4.0_obj_99.zip'
rows=list(csv.DictReader((SOURCE/'partof_element_parts.txt').open(),delimiter='\t'))
rng=np.random.default_rng(65)
points=[]; normals=[]; hemispheres=[]; selected=[]; totals=[]
def spatial_order(p, depth):
    if depth==0: return np.arange(len(p))
    axis=int(np.argmax(np.ptp(p,axis=0)))
    order=np.argsort(p[:,axis],kind='stable');half=len(p)//2
    return np.concatenate([order[:half][spatial_order(p[order[:half]],depth-1)],order[half:][spatial_order(p[order[half:]],depth-1)]])
with zipfile.ZipFile(archive) as z:
    members={Path(n).stem:n for n in z.namelist() if n.endswith('.obj')}
    for hemi,concept in enumerate(['FMA61819','FMA67292']):
        ids=sorted({r['element file id'] for r in rows if r['concept id']==concept})
        triangles=[]
        for identity in ids:
            content=z.read(members[identity]).decode('utf-8')
            vertices=[]; faces=[]
            for line in content.splitlines():
                fields=line.split()
                if not fields: continue
                if fields[0]=='v': vertices.append([float(x) for x in fields[1:4]])
                if fields[0]=='f':
                    face=[int(x.split('/')[0])-1 for x in fields[1:]]
                    for j in range(1,len(face)-1):faces.append([face[0],face[j],face[j+1]])
            vertices=np.array(vertices); faces=np.array(faces)
            assert len(vertices) and len(faces),identity
            triangles.append(vertices[faces]);selected.append(identity)
        t=np.concatenate(triangles)
        area=np.linalg.norm(np.cross(t[:,1]-t[:,0],t[:,2]-t[:,0]),axis=1)/2
        idx=rng.choice(len(t),size=32768,p=area/area.sum())
        picked=t[idx];u=np.sqrt(rng.random(32768));v=rng.random(32768)
        p=(1-u[:,None])*picked[:,0]+(u*(1-v))[:,None]*picked[:,1]+(u*v)[:,None]*picked[:,2]
        normal=np.cross(picked[:,1]-picked[:,0],picked[:,2]-picked[:,0])
        normal/=np.maximum(np.linalg.norm(normal,axis=1)[:,None],1e-12)
        # Three balanced spatial splits produce eight contiguous4096-point regions.
        # Seven more splits keep each32-point phase ring spatially compact.
        order=spatial_order(p,10)
        points.append(p[order]);normals.append(normal[order]);hemispheres.append(np.full(32768,hemi,dtype=np.uint8));totals.append(len(t))
points=np.concatenate(points);hemi=np.concatenate(hemispheres)
center=(points.min(axis=0)+points.max(axis=0))/2
points=(points-center)/(np.ptp(points,axis=0).max()/2)
points=points.astype('<f4');normals=np.concatenate(normals).astype('<f4')
points.tofile(ROOT/'brain-65536.xyz.f32');normals.tofile(ROOT/'brain-65536.normals.f32')
np.savez_compressed(ROOT/'brain-65536.npz',points=points,normals=normals,hemisphere=hemi)
assert points.shape==(65536,3) and np.isfinite(points).all()
manifest={'source':'BodyParts3D 4.0 PART-OF, 99% polygon-reduced archive',
 'url':'https://dbarchive.biosciencedbc.jp/data/bodyparts3d/LATEST/partof_BP3D_4.0_obj_99.zip',
 'license':'CC BY 4.0','license_url':'https://dbarchive.biosciencedbc.jp/en/bodyparts3d/lic.html',
 'attribution':'BodyParts3D, © The Database Center for Life Science licensed under CC Attribution 4.0 International',
 'archive_sha256':hashlib.sha256(archive.read_bytes()).hexdigest(),'selected_mesh_ids':selected,
 'source_triangles_per_hemisphere':totals,'point_count':len(points),'seed':65,
 'adaptation':'32768 area-weighted barycentric samples per hemisphere; translated to origin and uniformly scaled. Includes the source hemisphere constituents; not a new clinical reconstruction.',
 'format':'little-endian float32 xyz, source axes retained; left hemisphere first32768, right next32768. Source X lateral, Y anterior/posterior, Z superior/inferior. Display X horizontal, Y vertical and Z depth for superior view. No hemisphere mirror or artificial separation.',
 'musical_partition':'Balanced spatial kd partitions, eight4096-point groups per hemisphere; each32-point ring is spatially compact. Musical groups are not atlas anatomical labels.',
 'bounds':[points.min(axis=0).tolist(),points.max(axis=0).tolist()],
 'point_cloud_sha256':hashlib.sha256(points.tobytes()).hexdigest(),
 'normals_sha256':hashlib.sha256(normals.tobytes()).hexdigest()}
(ROOT/'provenance.json').write_text(json.dumps(manifest,indent=2)+'\n')
fig,axes=plt.subplots(1,2,figsize=(16,9),facecolor='#071118')
for ax,angle,title in zip(axes,[0,.6],['SUPERIOR / SOURCE GEOMETRY','OBLIQUE / SOURCE GEOMETRY']):
    ax.set_facecolor('#071118');ax.set_aspect('equal');ax.axis('off')
    x=points[:,0];y=points[:,1]*np.cos(angle)-points[:,2]*np.sin(angle);depth=points[:,1]*np.sin(angle)+points[:,2]*np.cos(angle)
    order=np.argsort(depth);light=(.45+.55*(depth-depth.min())/np.ptp(depth))*(.6+.4*np.abs(normals@np.array([.25,.3,.92])))
    color=np.tile([.28,.85,.73],(len(points),1))*light[:,None]
    ax.scatter(x[order],y[order],s=.38,c=color[order],linewidths=0,rasterized=True)
    ax.set_title(title,color='#a0f6d4',fontfamily='monospace',fontsize=11,pad=8)
fig.subplots_adjust(top=.83,bottom=.14)
fig.suptitle('CORTEX / 65 — ANATOMICAL POINT-CLOUD STUDY',color='#ddedeb',fontfamily='monospace',fontsize=18,y=.94)
fig.text(.5,.075,'65,536 surface samples · BodyParts3D / DBCLS · CC BY 4.0\nGeometry reference — musical regions and activity are separate design layers.',ha='center',color='#84aaa9',fontfamily='monospace',fontsize=10)
fig.savefig(ROOT/'brain-point-cloud-reference.png',dpi=180,facecolor=fig.get_facecolor())
print(json.dumps({'points':len(points),'source_triangles':totals,'meshes':len(selected),'preview':str(ROOT/'brain-point-cloud-reference.png')}))
