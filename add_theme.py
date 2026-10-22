import re
p = 'index.html'
s = open(p).read()
if 'pbg' in s:
    raise SystemExit('Already patched, nothing to do.')

CSS = """
  #main { background:linear-gradient(var(--tint,#2b3a67), var(--panel) 340px); }
  #pbg { position:fixed; inset:0; width:100%; height:100%; object-fit:cover; z-index:-1; display:none; }
  body.hasbg #pbg { display:block; }
  body.hasbg #side { background:rgba(18,18,18,.72); }
  body.hasbg #main { background:transparent; }
</style>"""

JS = """const PTH = {green:['#1db954','#1d3a2a'],blue:['#3b82f6','#1b2f5a'],purple:['#a855f7','#3a1f5c'],pink:['#ec4899','#5c1f3f'],orange:['#f97316','#5c3216'],red:['#ef4444','#5c1f1f'],teal:['#14b8a6','#154a46'],gold:['#eab308','#514514']};
async function applyMusicUI() {
  try {
    const st = JSON.parse(localStorage.getItem('musicSettings') || '{}'), t = PTH[st.theme] || PTH.green, r = document.documentElement.style;
    r.setProperty('--green', t[0]); r.setProperty('--tint', t[1]);
  } catch (e) {}
  try {
    const db = await new Promise((res, rej) => { const q = indexedDB.open('musicui', 1); q.onupgradeneeded = () => q.result.createObjectStore('kv'); q.onsuccess = () => res(q.result); q.onerror = () => rej(); });
    const b = await new Promise(res => { const q = db.transaction('kv').objectStore('kv').get('bg'); q.onsuccess = () => res(q.result); q.onerror = () => res(null); });
    if (b) { $('pbg').src = URL.createObjectURL(b); document.body.classList.add('hasbg'); } else document.body.classList.remove('hasbg');
  } catch (e) {}
}
window.addEventListener('message', e => { if (e.origin === location.origin && e.data === 'musicui') applyMusicUI(); });
applyMusicUI();
start();
</script>"""

checks = []
s, n = re.subn(r'</style>', lambda m: CSS, s, count=1); checks.append(n)
s, n = re.subn(r'<p id="loading">', lambda m: '<img id="pbg" alt=""><p id="loading">', s, count=1); checks.append(n)
s, n = re.subn(r'start\(\);\s*</script>', lambda m: JS, s, count=1); checks.append(n)
assert checks == [1,1,1], 'Could not find all spots, nothing changed: %s' % checks
open(p, 'w').write(s)
print('call-page colors added OK')
