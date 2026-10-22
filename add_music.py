import re
p = 'index.html'
s = open(p).read()
if 'musicFrame' in s:
    raise SystemExit('Already patched, nothing to do.')

CSS = """
  #main { display:flex; flex-direction:column; }
  #tabs { display:flex; gap:8px; margin-bottom:16px; }
  .tab { background:transparent; color:#fff; border:1px solid #727272; padding:8px 18px; }
  .tab.on { background:var(--green); color:#000; border-color:var(--green); }
  #callsPane { flex:1; }
  #musicFrame { display:none; flex:1; width:100%; min-height:520px; border:0; border-radius:8px; background:#000; }
</style>"""

TABS = '<div id="main"><div id="tabs"><button class="tab on" data-t="calls" onclick="tab(\'calls\')">Calls</button><button class="tab" data-t="music" onclick="tab(\'music\')">Music</button></div><div id="callsPane"><p id="status"></p>'
END = '<audio id="out" autoplay></audio></div><iframe id="musicFrame" title="Music"></iframe></div>'

JS = """function tab(t) {
  const music = t === 'music';
  $('callsPane').style.display = music ? 'none' : 'block';
  $('musicFrame').style.display = music ? 'block' : 'none';
  document.querySelectorAll('.tab').forEach(b => b.classList.toggle('on', b.dataset.t === t));
}
start();
</script>"""

checks = []
s, n = re.subn(r'</style>', lambda m: CSS, s, count=1); checks.append(n)
s, n = re.subn(r'<div id="main">\s*<p id="status"></p>', lambda m: TABS, s, count=1); checks.append(n)
s, n = re.subn(r'<audio id="out" autoplay></audio>\s*</div>', lambda m: END, s, count=1); checks.append(n)
s, n = re.subn(r"show\('appBox'\);", lambda m: "show('appBox'); $('musicFrame').src = 'music.html';", s, count=1); checks.append(n)
s, n = re.subn(r'start\(\);\s*</script>', lambda m: JS, s, count=1); checks.append(n)
assert checks == [1,1,1,1,1], 'Could not find all spots, nothing changed: %s' % checks
open(p, 'w').write(s)
print('music tab added OK')
