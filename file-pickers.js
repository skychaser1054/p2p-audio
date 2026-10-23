/* File-picker presentation. Native inputs retain their files, permissions and handlers. */
(() => {
'use strict';
/* PNG_ICONS_START */
const pickerIcons = {"file":"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAIAAAACACAYAAADDPmHLAAAACXBIWXMAAAsTAAALEwEAmpwYAAAFgUlEQVR4nO2dTWhdRRTHx6pF/AK13WjduSgKoqAScVdTl1oXgrh07caFooUWhGI24kdBqJssuuyughaqDeKmC21jUnEjuHBjSj64b87/vAilHZnmZaGY3Pveu5M5987/BwMhuUnmnfO7587cr3GOEEIIIYQQQgghhBBCCGmfEMJ+VT00HA5fFJFZQ+0ogLdF5F3v/ZPMfYsAeFZEPxLRRUBDF5qI/rG+vv44RZgCEXkKwLncyZxcAoj3/gAlmKDMA/hSBDdzJ7GF9ntVVQ9RgoYMBoNHAF0wkLgWK4FejZ+LEtSwtrb2IKC/5k5YIgl+ZiXYvezvE8HXuRPFSpAJAMdzJ4iVIBPe+4OADnInh5UgEwBONz+W4icAH6rqawZO/szGqR7HBFNP+bRqEMSByPANZwxANyatHBwYbu39rzTY64eq+rwzCKYQgBI0Lv943xkFUwpQvAQieqFm79cQwr2uxwKg5MMBoEs1wbnoDIMaAbzHDUqwewBXavaMeddhAURwXgSgBJMH8IzreP+9H74EqB9DgnKuHZQggLt9sosSTBXAPvTfU4LpAtiH/ntKMF0A+9B/TwmmC2Af+u/Hl2CxlwPDUgWIUILCBYgUL0HpArjSJaAAhUtAAQqXgAIULgEFKFwCClC4BBSgcAkoQOESUIDCJaAAhUtAAQqXgAIULgEFKFwCClC4BAUI8PdomxTNi+itMST4S1UfdZbouwAw1uLTzCEEOy+uogCaQQRcclagAJqhCuims0IPBFjJXdYnOAzcdFbogQALHRTghrNC1wVQ1WO5EzpBE2eFrguw/Yazjr3VdMNZoQ8CROIbwgGcFNGv8jf8RgEKRgRnKEBCQgj3qOpMbPFrZwwKkDS4+s5/Dlsb8XvOEBQgWWB1buexis45I1CAPU4+jElAATIkH4YkoACtBlNPTTDP/iRvnzkLyJn8kFsCCpA/+SGnBBTARvJDLgkogJ3khxwSUIA9GO1jzLaXswMKYGfPDzkqAQWwmfwwqgSn0n8eTgNN39ChqscogJH7ATLd0rVAAYwIEB+WaJY0/NDONnr7AQ0KYEQAQJcbJGwuLhFXv53MNpxJLFMAMwLgRF3y43ZNBXCNppM4QQGMCBAXpBLB5R2S//H2duMIEIm/u8PnuZx6ESzOAsYk3tYVb+gE9Bqgq3GQpqqv/juo4wkQiX9jNMiMf/Na/B97cQsZBUgS1PEFyAUFSBJUCtDLMUBTKEAiKED78BCQJKg8BCSBFaB9WAGSBJUVIAmsAO3DCpAkqKwASWAFaB9WgCRBZQUovQIcaXAq+IgzACtAArz3h+sE8N4fdgagAIkAdGkXAZacEShAIlT1uR1e0Ozjz5wRKEBCqmrzCRE9K4I/t5qejd9zhqAAhSN8LqBshAKUjVCAshEKUDZCAcpGOibAru/bF9H53H3sGiI6XyPAirOCiP5S09mLufvYNQD9vmanWnRWENELNReDNIRwX+5+doXr18P9IhjWCPCNswKA03UXWQB8kLufXQHA8Qbx/MxZQUSO1l9mxaaqvpC7r9ZR1ZkYqwaXrV92Vggh7Ae0qrc2LpI4fDN3fy0SQrhDRN5quJLoRgjhbmcJAF806Pj28etKLHPxNStbz+OX21T19a3lavRq0/gB+NRZw3t/ANBB8w/BhsliUJlcPzgSB3pMrCaWG+85q4QQ9ongPCXQJMkX0W9DCHc6y6yurj4wekkDyzxajcFyjK3rAlVVPQzoJUqgbZX9H733B12XiNOUeIKoY4sxBkttK3b4PIRwl+sqo8UYz+UOZgfbdwCecX1BRJ4ercp5hVVB/29vvzU6P3Iyxsr1mVjSVPWxrdOeUvqJoBlVPWTuzB4hhBBCCCGEEEIIIYSQvvAP7LAH74ZONp8AAAAASUVORK5CYII=","folder":"data:image/png;base64,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","image":"data:image/png;base64,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","music":"data:image/png;base64,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"};
/* PNG_ICONS_END */
const records = new WeakMap();
let sequence = 0;
const specificLabels = {
 upFile:'Choose audio',upCover:'Choose artwork',pfAv:'Choose photo',pfBd:'Choose backdrop',
 bgFile:'Choose background',toolPlCover:'Choose cover',toolCover:'Choose cover',
 bulkFiles:'Choose files',bulkFolder:'Choose folder',toolLyImport:'Choose lyrics',playlistImport:'Choose playlist'
};
function describe(input) {
 const accept = (input.accept || '').toLowerCase();
 if (input.webkitdirectory || input.hasAttribute('webkitdirectory')) return {icon:'folder',title:specificLabels[input.id] || 'Choose folder',hint:'Import a music folder'};
 if (/audio|\.mp3|\.flac/.test(accept)) return {icon:'music',title:specificLabels[input.id] || (input.multiple?'Choose audio files':'Choose audio'),hint:input.multiple?'Add music from your device':'Browse your music files'};
 if (/image|\.png|\.jpg/.test(accept)) return {icon:'image',title:specificLabels[input.id] || 'Choose image',hint:'Browse your photos & artwork'};
 if (/\.lrc|\.txt|text\/plain/.test(accept)) return {icon:'file',title:specificLabels[input.id] || 'Choose lyrics',hint:'LRC or text file'};
 if (/\.json|application\/json/.test(accept)) return {icon:'file',title:specificLabels[input.id] || 'Choose playlist',hint:'Import a playlist file'};
 return {icon:'file',title:specificLabels[input.id] || (input.multiple?'Choose files':'Choose file'),hint:'Browse files on your device'};
}
function setText(el, value) {if (el.textContent !== value) el.textContent = value;}
function sizeLabel(size) {return size >= 1048576 ? (size/1048576).toFixed(1)+' MB' : Math.max(1,Math.round(size/1024))+' KB';}
function refresh(input) {
 const record = records.get(input);if (!record) return;
 const detail = describe(input), files = [...(input.files || [])];
 const disabled = input.matches(':disabled');
 record.wrap.dataset.disabled = String(disabled);
 record.wrap.classList.toggle('has-file',files.length > 0);
 if (record.image.src !== pickerIcons[detail.icon]) record.image.src = pickerIcons[detail.icon];
 setText(record.heading, files.length > 1 ? files.length+' files selected' : files[0]?.name || detail.title);
 setText(record.caption, files.length > 1 ? files[0].name+' + '+(files.length-1)+' more' : files.length ? sizeLabel(files[0].size)+' · Tap to change' : detail.hint);
 record.wrap.title = files.length ? files.map(f=>f.name).join('\n') : detail.title;
 if (!input.hasAttribute('aria-label')) input.setAttribute('aria-label',detail.title);
}
function decorateHidden(input) {
 if (!input.id) return;
 for (const label of document.querySelectorAll('label[for]')) {
  if (label.htmlFor !== input.id || label.dataset.pngPickerTrigger) continue;
  label.dataset.pngPickerTrigger = 'true';label.classList.add('png-file-trigger');
  const image = document.createElement('img');image.src = pickerIcons[describe(input).icon];image.alt = '';image.setAttribute('aria-hidden','true');
  label.prepend(image);
 }
}
function enhance(input) {
 if (input.hidden) {decorateHidden(input);return;}
 if (records.has(input)) {refresh(input);return;}
 if (!input.parentNode) return;
 const detail = describe(input), wrap = document.createElement('span');
 wrap.className = 'png-file-picker';wrap.dataset.pickerKind = detail.icon;
 const visual = document.createElement('span');visual.className = 'png-file-visual';visual.setAttribute('aria-hidden','true');
 const art = document.createElement('span');art.className = 'png-file-art';
 const image = document.createElement('img');image.alt = '';image.width = 26;image.height = 26;image.src = pickerIcons[detail.icon];art.append(image);
 const text = document.createElement('span');text.className = 'png-file-copy';
 const heading = document.createElement('span');heading.className = 'png-file-heading';
 const caption = document.createElement('span');caption.className = 'png-file-caption';text.append(heading,caption);
 const arrow = document.createElement('span');arrow.className = 'png-file-chevron';arrow.textContent = '›';
 visual.append(art,text,arrow);wrap.append(visual);
 const host = input.closest('label');
 if (host) {
  host.classList.add('png-file-host');
  if (host.classList.contains('ghost')) host.classList.remove('ghost');
  // The visual already names these actions; preserve descriptive field labels.
  for (const node of [...host.childNodes]) if (node.nodeType===3 && /^choose (files?|folder|playlist file)$/i.test(node.textContent.trim())) node.textContent='';
 }
 input.parentNode.insertBefore(wrap,input);wrap.append(input);
 input.classList.add('png-file-input');
 if (!input.id) input.id = 'png-picker-'+(++sequence);
 records.set(input,{wrap,image,heading,caption});
 input.addEventListener('change',()=>refresh(input));
 input.addEventListener('cancel',()=>refresh(input));
 refresh(input);
}
function scan() {for (const input of document.querySelectorAll('input[type="file"]')) enhance(input);}
scan();
if (typeof MutationObserver !== 'undefined') {
 const observer = new MutationObserver(scan);
 observer.observe(document.body,{childList:true,subtree:true,attributes:true,attributeFilter:['disabled','accept','multiple','webkitdirectory','hidden']});
}
// Include this public module in the offline shell even on the first visit.
const scriptURL = document.currentScript?.src;
if (scriptURL && 'serviceWorker' in navigator) navigator.serviceWorker.ready.then(reg=>{
 (navigator.serviceWorker.controller || reg.active)?.postMessage({type:'CACHE_SHELL',urls:[scriptURL]});
}).catch(()=>{});
})();
