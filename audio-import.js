/* Validated binary uploads and direct-file URL imports. */
(function(root){
'use strict';
const MAX_BYTES=50*1024*1024;
const TYPES={mp3:'audio/mpeg',m4a:'audio/mp4',m4b:'audio/mp4',mp4:'audio/mp4',aac:'audio/aac',wav:'audio/wav',wave:'audio/wav',flac:'audio/flac',ogg:'audio/ogg',oga:'audio/ogg',opus:'audio/ogg',webm:'audio/webm'};
const MIME_EXT={'audio/mpeg':'mp3','audio/mp3':'mp3','audio/mp4':'m4a','audio/x-m4a':'m4a','audio/aac':'aac','audio/wav':'wav','audio/x-wav':'wav','audio/flac':'flac','audio/x-flac':'flac','audio/ogg':'ogg','audio/webm':'webm'};
function audioType(file){
 const ext=String(file?.name||'').split('.').pop().toLowerCase(),mime=String(file?.type||'').split(';')[0].toLowerCase();
 if(TYPES[ext])return {extension:ext==='wave'?'wav':ext,mime:TYPES[ext]};
 if(MIME_EXT[mime])return {extension:MIME_EXT[mime],mime:TYPES[MIME_EXT[mime]]};
 throw Error('Choose an MP3, M4A, AAC, WAV, FLAC, OGG, Opus, or WebM audio file.');
}
async function bytes(file,max=MAX_BYTES){
 if(!file||typeof file.arrayBuffer!=='function')throw Error('Select a file before uploading.');
 if(!Number.isFinite(file.size)||file.size<=0)throw Error('This file is empty. In Files, download it to your iPhone, then select it again.');
 if(file.size>max)throw Error('This file is too large. The limit is '+Math.round(max/1048576)+' MB.');
 let data;try{data=await file.arrayBuffer();}catch{throw Error('The file could not be read. In Files, download it to this device and select it again.');}
 if(!data?.byteLength||data.byteLength!==file.size)throw Error('The file was not fully read. Download the complete file in Files, then retry.');
 return data;
}
async function prepare(file){const type=audioType(file);return {...type,body:await bytes(file)};}
function directURL(value){let url;try{url=new URL(String(value).trim());}catch{throw Error('Enter a complete https:// link to an audio file.');}
 if(url.protocol!=='https:'||url.username||url.password)throw Error('Use an HTTPS file link without login credentials.');
 if(/(^|\.)(youtube\.com|youtu\.be|music\.youtube\.com|spotify\.com|soundcloud\.com)$/.test(url.hostname))throw Error('This is a streaming-service page, not a direct audio file. Use a downloadable audio-file link.');
 return url;
}
function fileName(url){let name;try{name=decodeURIComponent(new URL(url).pathname.split('/').pop()||'Imported song');}catch{name='Imported song';}return name.replace(/[\u0000-\u001f\\/<>:"|?*]/g,'').slice(0,160)||'Imported song';}
const metadataSources=new WeakMap();let active=null;
const moduleURL=typeof document!=='undefined'?document.currentScript?.src:null;
function metadataSource(file){return metadataSources.get(file)||file;}
async function download(url,signal,progress){
 let response;try{response=await fetch(url.href,{signal,credentials:'omit',referrerPolicy:'no-referrer',cache:'no-store'});}catch(e){if(signal.aborted)throw Error('Import cancelled.');throw Error('This host does not allow direct imports. Download the audio file, then choose it here.');}
 if(!response.ok)throw Error('The file host returned '+response.status+'. Use a direct downloadable file link.');
 const mime=(response.headers.get('content-type')||'').split(';')[0].toLowerCase();
 if(/text\/|json|xml|mpegurl/.test(mime))throw Error('This link opens a page or playlist, not an audio file.');
 const total=Number(response.headers.get('content-length'))||0;if(total>MAX_BYTES)throw Error('The audio file exceeds 50 MB.');
 const chunks=[];let size=0;
 if(response.body?.getReader){const reader=response.body.getReader();try{while(true){const {done,value}=await reader.read();if(done)break;size+=value.byteLength;if(size>MAX_BYTES){await reader.cancel();throw Error('The audio file exceeds 50 MB.');}chunks.push(value);progress(total?Math.min(100,Math.round(size/total*100)):null);}}finally{reader.releaseLock();}}
 else{const buffer=await response.arrayBuffer();size=buffer.byteLength;if(size>MAX_BYTES)throw Error('The audio file exceeds 50 MB.');chunks.push(buffer);}
 if(!size)throw Error('The link returned no audio data.');
 const file=new File(chunks,fileName(response.url||url.href),{type:mime||'application/octet-stream'});audioType(file);return file;
}
function encode(buffer,job,progress){return new Promise((resolve,reject)=>{
 const url=new URL('./mp3-encoder-worker.js',moduleURL||location.href);if(moduleURL)url.search=new URL(moduleURL).search;
 const worker=new Worker(url.href);job.worker=worker;job.rejectWorker=reject;
 worker.onerror=()=>{worker.terminate();reject(Error('The MP3 encoder could not load. Check your connection and retry.'));};
 worker.onmessage=e=>{if(e.data.error){worker.terminate();reject(Error(e.data.error));}else if(e.data.data){worker.terminate();job.worker=null;job.rejectWorker=null;resolve(new Blob([e.data.data],{type:'audio/mpeg'}));}else progress(e.data.progress);};
 const channels=Array.from({length:buffer.numberOfChannels},(_,i)=>buffer.getChannelData(i).slice().buffer);
 worker.postMessage({channels,sampleRate:buffer.sampleRate},channels);
});}
async function convert(file,job,progress){
 const duration=await readAudioDuration(file);if(!Number.isFinite(duration)||duration<=0||duration>600)throw Error('URL imports support songs up to 10 minutes.');
 if(job.abort.signal.aborted)throw Error('Import cancelled.');
 const type=audioType(file);if(type.extension==='mp3')return new File([file],file.name.replace(/\.[^.]+$/,'')+'.mp3',{type:'audio/mpeg'});
 const Audio=window.AudioContext||window.webkitAudioContext;if(!Audio)throw Error('This browser does not support audio conversion.');
 const context=new Audio({sampleRate:44100});let decoded;
 try{decoded=await context.decodeAudioData(await bytes(file));}catch{throw Error('This browser could not decode the audio. Try an MP3 or WAV file.');}finally{await context.close();}
 if(job.abort.signal.aborted)throw Error('Import cancelled.');
 if(decoded.numberOfChannels>2)throw Error('Choose a mono or stereo audio file.');
 const blob=await encode(decoded,job,progress);if(blob.size>MAX_BYTES)throw Error('The converted MP3 exceeds 50 MB.');
 return new File([blob],file.name.replace(/\.[^.]+$/,'')+'.mp3',{type:'audio/mpeg'});
}
function cancel(){if(!active)return;active.abort.abort();active.worker?.terminate();active.rejectWorker?.(Error('Import cancelled.'));active=null;}
function markup(){return `<details class="url-import-panel"><summary><span>Import from a link</span><small>Convert to MP3 & upload</small></summary><div class="url-import-content"><p class="sub">Enter or drop a direct audio-file link. YouTube and other website pages are not supported.</p><div id="audioUrlDrop" class="audio-url-drop" data-audio-url-drop><input id="audioUrl" type="url" inputmode="url" autocomplete="off" spellcheck="false" placeholder="https://example.com/song.wav" aria-label="Direct audio file link"><small>Drop a file link here, or type it above.</small></div><div class="tools"><button id="audioUrlConvert" class="green" type="button">Convert & upload</button><button id="audioUrlCancel" class="ghost" type="button" hidden>Cancel</button></div><progress id="audioUrlProgress" max="100" value="0" hidden></progress><p id="audioUrlStatus" class="sub" role="status" aria-live="polite">MP3, M4A, WAV and other browser-supported audio · up to 50 MB / 10 minutes.</p></div></details>`;}
function mount(){const button=document.getElementById('audioUrlConvert');if(!button){cancel();return;}if(button.dataset.bound)return;button.dataset.bound='true';
 const input=document.getElementById('audioUrl'),drop=document.getElementById('audioUrlDrop'),stop=document.getElementById('audioUrlCancel'),status=document.getElementById('audioUrlStatus'),bar=document.getElementById('audioUrlProgress');
 drop.addEventListener('dragover',e=>{e.preventDefault();drop.classList.add('drag-over');});drop.addEventListener('dragleave',()=>drop.classList.remove('drag-over'));
 drop.addEventListener('drop',e=>{e.preventDefault();drop.classList.remove('drag-over');const raw=e.dataTransfer.getData('text/uri-list').split(/\r?\n/).find(s=>s&&!s.startsWith('#'))||e.dataTransfer.getData('text/plain');try{input.value=directURL(raw).href;status.textContent='Link ready. Press Convert & upload.';}catch(err){status.textContent=err.message;}});
 stop.onclick=()=>cancel();
 button.onclick=async()=>{if(active)return;let url;try{url=directURL(input.value);}catch(e){status.textContent=e.message;return;}
  const userId=me?.id,selection=document.getElementById('upFile'),uploadButton=document.getElementById('upBtn'),previous=getUploadAudio();if(!userId||!selection)return;
  const job={abort:new AbortController(),worker:null};active=job;button.disabled=true;uploadButton.disabled=true;stop.hidden=false;bar.hidden=false;
  const title=document.getElementById('upTitle').value.trim(),artist=document.getElementById('upArtist').value.trim();
  const check=()=>{if(job.abort.signal.aborted||me?.id!==userId||document.getElementById('upFile')!==selection||getUploadAudio()!==previous)throw Error('Import cancelled because the song selection or account changed.');};
  try{
   status.textContent='Downloading audio…';const file=await download(url,job.abort.signal,n=>{if(n===null)bar.removeAttribute('value');else bar.value=n;});check();
   status.textContent='Converting to MP3…';bar.value=0;const mp3=await convert(file,job,n=>bar.value=n);check();
   let selected=mp3;selection.value='';try{const transfer=new DataTransfer();transfer.items.add(mp3);selection.files=transfer.files;selected=selection.files[0]||mp3;}catch{}
   metadataSources.set(selected,file);status.textContent='MP3 ready. Finding song details and artwork…';bar.value=100;
   await selectUploadAudio(selected);selection.dispatchEvent(new Event('cancel'));
   if(job.abort.signal.aborted||me?.id!==userId||document.getElementById('upFile')!==selection||getUploadAudio()!==selected)throw Error('Import cancelled.');
   if(title)document.getElementById('upTitle').value=title;if(artist)document.getElementById('upArtist').value=artist;
   if(!document.getElementById('upTitle').value.trim()||!document.getElementById('upArtist').value.trim()){status.textContent='MP3 ready. Add the missing title or artist below, then press Upload song.';return;}
   if(!document.getElementById('skipCover').checked&&!document.getElementById('upCover').files[0]&&!detectedCover){try{await retryArtwork();}catch{}}
   if(!document.getElementById('skipCover').checked&&!document.getElementById('upCover').files[0]&&!detectedCover){status.textContent='MP3 ready. Choose artwork or enable Upload without artwork, then press Upload song.';return;}
   if(job.abort.signal.aborted||me?.id!==userId||document.getElementById('upFile')!==selection||getUploadAudio()!==selected)throw Error('Import cancelled.');
   uploadButton.disabled=false;stop.hidden=true;status.textContent='Uploading the MP3…';await upload();
  }catch(e){if(document.getElementById('audioUrlStatus')===status)status.textContent=e.message||'Import failed. Please retry.';}
  finally{job.worker?.terminate();if(active===job)active=null;button.disabled=false;stop.hidden=true;uploadButton.disabled=false;}
 };
}
const api={MAX_BYTES,TYPES,audioType,bytes,prepare,directURL,fileName,metadataSource,download,markup,mount,cancel,busy:()=>!!active};
if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MusicImport=api;
})(typeof globalThis!=='undefined'?globalThis:this);
