'use strict';
// lamejs 1.2.1, LGPL-3.0: https://github.com/zhuker/lamejs
importScripts('https://cdn.jsdelivr.net/npm/lamejs@1.2.1/lame.min.js');
self.onmessage=event=>{
 try{
  const {channels,sampleRate}=event.data;
  if(!Array.isArray(channels)||!channels.length||channels.length>2||![32000,44100,48000].includes(sampleRate))throw Error('Invalid audio data for MP3 conversion.');
  const pcm=channels.map(c=>new Float32Array(c)),length=pcm[0].length;
  if(!length||pcm.some(c=>c.length!==length))throw Error('The audio track is empty.');
  const encoder=new lamejs.Mp3Encoder(pcm.length,sampleRate,192),chunks=[];let size=0;
  for(let offset=0;offset<length;offset+=1152){
   const block=pcm.map(channel=>{const floats=channel.subarray(offset,Math.min(offset+1152,length)),samples=new Int16Array(floats.length);for(let i=0;i<floats.length;i++){const value=Math.max(-1,Math.min(1,floats[i]));samples[i]=Math.round(value*(value<0?32768:32767));}return samples;});
   const encoded=encoder.encodeBuffer(block[0],block[1]);if(encoded.length){const copy=new Uint8Array(encoded);chunks.push(copy);size+=copy.length;}
   if(offset%(1152*100)===0)self.postMessage({progress:Math.round(offset/length*100)});
  }
  const tail=encoder.flush();if(tail.length){const copy=new Uint8Array(tail);chunks.push(copy);size+=copy.length;}
  if(!size)throw Error('MP3 conversion produced an empty file.');
  const mp3=new Uint8Array(size);let position=0;for(const chunk of chunks){mp3.set(chunk,position);position+=chunk.length;}
  self.postMessage({data:mp3.buffer},[mp3.buffer]);
 }catch(e){self.postMessage({error:e.message||'MP3 conversion failed.'});}
};
