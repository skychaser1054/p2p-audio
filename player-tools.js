/* Browser-independent playback rules, also exercised by the node test suite. */
(function(root) {
'use strict';
class QueueController {
  constructor(random = Math.random) { this.random=random; this.tracks=[]; this.index=-1; this.shuffle=false; this.repeat='off'; this.bag=[]; this.history=[]; this.shuffleStarted=false; }
  key(i) { return this.tracks[i]?._qid || this.tracks[i]?.id; }
  find(key) { return this.tracks.findIndex((_,i)=>this.key(i)===key); }
  setTracks(tracks,index=0) { this.tracks=tracks; this.index=tracks.length?Math.max(0,Math.min(index,tracks.length-1)):-1; this.bag=[]; this.history=[]; this.shuffleStarted=false; }
  fillBag() { this.shuffleStarted=true;this.bag=this.tracks.map((_,i)=>this.key(i)).filter(k=>k!==this.key(this.index)); for(let i=this.bag.length-1;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.bag[i],this.bag[j]]=[this.bag[j],this.bag[i]];} }
  jump(index) { if(index<0||index>=this.tracks.length)return -1; if(this.index>=0&&index!==this.index)this.history.push(this.key(this.index));this.index=index;this.bag=this.bag.filter(k=>k!==this.key(index));return index; }
  next(automatic=false) {
    if(!this.tracks.length)return -1;
    if(automatic&&this.repeat==='one')return this.index;
    let target=-1;
    if(this.shuffle){if(!this.bag.length){if(this.shuffleStarted&&this.repeat!=='all')return -1;this.fillBag();}target=this.find(this.bag.shift());if(target<0&&this.tracks.length===1&&this.repeat==='all')target=0;}
    else target=this.index+1<this.tracks.length?this.index+1:this.repeat==='all'?0:-1;
    return target<0?-1:this.jump(target);
  }
  previous() { while(this.history.length){const previous=this.history.pop(),i=this.find(previous);if(i>=0){if(this.shuffle)this.bag.unshift(this.key(this.index));this.index=i;return i;}}if(this.shuffle)return -1;this.index=Math.max(0,this.index-1);return this.index; }
  remove(index) { if(index===this.index)return false;const current=this.key(this.index);this.tracks.splice(index,1);this.index=this.find(current);this.bag=this.bag.filter(k=>this.find(k)>=0);this.history=this.history.filter(k=>this.find(k)>=0);return true; }
  reorder(from,to) { if(from<0||to<0||from>=this.tracks.length||to>=this.tracks.length)return;const current=this.key(this.index);this.tracks.splice(to,0,this.tracks.splice(from,1)[0]);this.index=this.find(current); }
  serialize() { return {entries:this.tracks.map((s,i)=>({id:s.id,key:this.key(i)})),index:this.index,shuffle:this.shuffle,repeat:this.repeat,shuffleStarted:this.shuffleStarted,bag:this.bag,history:this.history.slice(-1000)}; }
  restore(state,available) { const entries=Array.isArray(state?.entries)?state.entries.filter(e=>e&&typeof e.id==='string').slice(0,5000):[];const tracks=entries.map(e=>{const s=available.find(s=>s.id===e.id);return s?{...s,_qid:String(e.key||e.id)}:null}).filter(Boolean);this.setTracks(tracks,Math.max(0,entries.slice(0,state.index+1).filter(e=>available.some(s=>s.id===e.id)).length-1));this.shuffle=!!state.shuffle;this.shuffleStarted=!!state.shuffleStarted;this.repeat=['off','all','one'].includes(state.repeat)?state.repeat:'off';this.bag=(Array.isArray(state.bag)?state.bag:[]).filter(k=>this.find(k)>=0&&k!==this.key(this.index));this.history=(Array.isArray(state.history)?state.history:[]).filter(k=>this.find(k)>=0);return tracks; }
}
function listenedDelta(previous,current,elapsed,rate=1) { if(!Number.isFinite(previous)||!Number.isFinite(current)||elapsed<=0||elapsed>15||rate<=0)return 0;const moved=current-previous;if(moved<0||moved>elapsed*rate+1)return 0;return Math.max(0,Math.min(elapsed,moved/rate)); }
function qualifies(seconds,duration){return seconds>=Math.min(30,Number.isFinite(duration)&&duration>0?duration/2:30);}
function normalizeName(value){return String(value||'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^\p{L}\p{N}]/gu,'');}
function rankCounts(events,field){const totals=new Map();for(const e of events){const key=e[field]||'Unknown';const v=totals.get(key)||{name:key,seconds:0,plays:0};v.seconds+=Number(e.listened_seconds)||0;v.plays+=e.qualified?1:0;totals.set(key,v);}return [...totals.values()].sort((a,b)=>b.seconds-a.seconds);}
const api={QueueController,listenedDelta,qualifies,normalizeName,rankCounts};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicTools=api;
})(typeof globalThis!=='undefined'?globalThis:this);
