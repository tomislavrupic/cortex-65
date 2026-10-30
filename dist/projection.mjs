export function projectAnatomicalPoint(point,{hemisphereSign=1,spread=0,yaw=0,pitch=0,aspect=1,scale=1}={},offset=0){
 const x=point[offset]+hemisphereSign*.45*Math.max(0,Math.min(1,spread)),y=point[offset+1],z=point[offset+2],cy=Math.cos(yaw),sy=Math.sin(yaw),cx=Math.cos(pitch),sx=Math.sin(pitch),xx=cy*x+sy*z,zz=-sy*x+cy*z,yy=cx*y-sx*zz,z2=sx*y+cx*zz,perspective=4.8/(4.8-z2);
 return{x:xx*perspective*scale/aspect,y:yy*perspective*scale-.015,z:z2};
}
