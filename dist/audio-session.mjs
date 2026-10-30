// Call ensure directly from a user gesture: creation and resume precede awaits.
export class AudioSession {
 constructor({createContext,build,onContext=()=>{},onFailure=()=>{}}){Object.assign(this,{createContext,build,onContext,onFailure});this.context=null;this.pending=null;this.ready=false;}
 ensure(){
  if(this.pending)return this.pending;
  try{if(!this.context||this.context.state==='closed'){this.context=this.createContext();this.ready=false;this.onContext(this.context);}
   const context=this.context,resumed=context.resume(); // iOS activation is still live here.
   const built=this.ready?Promise.resolve():this.build(context);
   this.pending=Promise.all([resumed,built]).then(()=>{if(context.state!=='running')throw new Error('Audio is interrupted. Tap Play again to resume.');this.ready=true;return context;}).catch(error=>{this.ready=false;this.context=null;try{context.close().catch(()=>{});}catch{}this.onFailure(error);throw error;}).finally(()=>{this.pending=null;});return this.pending;
  }catch(error){this.ready=false;const failed=this.context;this.context=null;try{failed?.close().catch(()=>{});}catch{}this.onFailure(error);return Promise.reject(error);}
 }
}
