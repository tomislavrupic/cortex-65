// Start synchronously from the pointer gesture; excite only after audio and transport are ready.
export function createCortexTrigger({needsStart,start,canExcite,excite}){
 let pendingStart=null;
 return async hit=>{
  if(!hit)return false;
  if(needsStart()){
   if(pendingStart)return false;
   try{pendingStart=Promise.resolve(start());await pendingStart;}finally{pendingStart=null;}
  }
  if(!canExcite())return false;
  excite(hit);return true;
 };
}
