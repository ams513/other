(function () {
  'use strict';
  var VIDEO = 'other-stark.mp4';
  var site = /(^|[?&])site(=|&|$)/.test(location.search);
  var go = document.getElementById('go');
  var statusEl = document.getElementById('status');
  var msgsEl = document.getElementById('msgs');
  var tabsEl = document.getElementById('tabs');
  var appsEl = document.getElementById('apps');
  var TITLE = site ? 'Stark' : 'The other Stark';
  var cur = 0;
  var file = null;
  var filePromise = null;
  var cards;

  function byId(id) { return document.getElementById(id); }
  function setText(id, t) { var e = byId(id); if (e) e.textContent = t; }

  // One page, two modes. Default: The other Stark (with the video). ?site: the whole site, no video.
  var mode = site ? 's' : 'o';
  Array.prototype.slice.call(msgsEl.querySelectorAll('.msg')).forEach(function (c) {
    if (c.getAttribute('data-m') !== mode) c.parentNode.removeChild(c);
  });
  cards = Array.prototype.slice.call(msgsEl.querySelectorAll('.msg'));
  if (site) {
    Array.prototype.slice.call(document.querySelectorAll('.only-o')).forEach(function (e) { e.parentNode.removeChild(e); });
    document.title = 'Share Stark';
    setText('title', 'Pull the plug.');
    setText('sub', 'It still works. One tap, then send it.');
    setText('go-t', 'Share Stark');
    setText('go-s', 'Message and link');
    byId('foot').innerHTML = 'Made by Stark. <a href="https://starkforall.com/">starkforall.com</a>';
  }

  function say(m) { statusEl.textContent = m; }
  function msg() { return cards[cur].textContent.replace(/\s+/g, ' ').trim(); }
  function firstUrl() { var m = msg().match(/https?:\/\/[^\s]+/); return m ? m[0] : 'https://starkforall.com/'; }
  function body() { return msg().replace(/\s*https?:\/\/[^\s]+/g, '').replace(/\s+/g, ' ').replace(/[:\s]+$/, ''); }
  function enc(s) { return encodeURIComponent(s); }

  var apps = [
    ['Messages', function (m) { return 'sms:?&body=' + enc(m); }],
    ['WhatsApp', function (m) { return 'https://wa.me/?text=' + enc(m); }],
    ['X', function (m) { return 'https://twitter.com/intent/tweet?text=' + enc(m); }],
    ['Facebook', function (m) { return 'https://www.facebook.com/sharer/sharer.php?u=' + enc(firstUrl()) + '&quote=' + enc(body()); }],
    ['LinkedIn', function (m) { return 'https://www.linkedin.com/feed/?shareActive=true&text=' + enc(m); }],
    ['Reddit', function (m) { return 'https://www.reddit.com/submit?url=' + enc(firstUrl()) + '&title=' + enc(body().slice(0, 290)); }],
    ['Bluesky', function (m) { return 'https://bsky.app/intent/compose?text=' + enc(m); }],
    ['Telegram', function (m) { return 'https://t.me/share/url?url=' + enc(firstUrl()) + '&text=' + enc(body()); }],
    ['Threads', function (m) { return 'https://www.threads.net/intent/post?text=' + enc(m); }],
    ['Email', function (m) { return 'mailto:?subject=' + enc(TITLE) + '&body=' + enc(m); }]
  ];
  var links = [];
  apps.forEach(function (a) {
    var li = document.createElement('li');
    var el = document.createElement('a');
    el.textContent = a[0];
    el.setAttribute('aria-label', 'Share with ' + a[0]);
    if (a[0] !== 'Messages' && a[0] !== 'Email') { el.target = '_blank'; el.rel = 'noopener noreferrer'; }
    li.appendChild(el); appsEl.appendChild(li);
    links.push([el, a[1]]);
  });
  var cli = document.createElement('li');
  var cb = document.createElement('button');
  cb.type = 'button'; cb.textContent = 'Copy message';
  cli.appendChild(cb); appsEl.appendChild(cli);

  function refresh() {
    var m = msg();
    links.forEach(function (l) { l[0].href = l[1](m); });
  }

  function select(i, scroll) {
    cur = i;
    Array.prototype.forEach.call(tabsEl.children, function (b, k) { b.setAttribute('aria-pressed', k === i ? 'true' : 'false'); });
    if (scroll) msgsEl.scrollTo({ left: cards[i].offsetLeft - msgsEl.offsetLeft, behavior: 'smooth' });
    refresh();
  }
  cards.forEach(function (c, i) {
    var b = document.createElement('button');
    b.type = 'button'; b.textContent = String(i + 1);
    b.setAttribute('aria-label', 'Message ' + (i + 1));
    b.addEventListener('click', function () { select(i, true); });
    tabsEl.appendChild(b);
  });
  var t = null;
  msgsEl.addEventListener('scroll', function () {
    clearTimeout(t);
    t = setTimeout(function () {
      var i = Math.round(msgsEl.scrollLeft / (msgsEl.scrollWidth / cards.length));
      i = Math.max(0, Math.min(cards.length - 1, i));
      if (i !== cur) select(i, false);
    }, 80);
  }, { passive: true });
  msgsEl.addEventListener('keydown', function (e) {
    if (e.key === 'ArrowRight' && cur < cards.length - 1) { select(cur + 1, true); e.preventDefault(); }
    if (e.key === 'ArrowLeft' && cur > 0) { select(cur - 1, true); e.preventDefault(); }
  });
  document.addEventListener('keydown', function (e) {
    var n = /^[1-9]$/.test(e.key) ? +e.key : 0;
    if (n && n <= cards.length && !e.ctrlKey && !e.metaKey && !e.altKey) select(n - 1, true);
  });

  function copy() {
    var m = msg();
    if (navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(m).then(function () { say('Message copied. Paste it anywhere.'); }, function () { say('Copy failed. Select the message above and copy it.'); });
    }
    say('Copy not available here. Select the message above and copy it.');
  }
  cb.addEventListener('click', copy);

  function loadFile() {
    if (site) return Promise.resolve(null);
    if (!filePromise) {
      filePromise = fetch(VIDEO).then(function (r) {
        if (!r.ok) throw new Error('video');
        return r.blob();
      }).then(function (b) {
        file = new File([b], 'The-other-Stark.mp4', { type: 'video/mp4' });
        return file;
      }).catch(function () { filePromise = null; return null; });
    }
    return filePromise;
  }

  function doShare() {
    var m = msg();
    var withFile = file && navigator.canShare && navigator.canShare({ files: [file] });
    var data = withFile ? { files: [file], text: m } : { text: body(), url: firstUrl() };
    if (withFile || site) data.title = TITLE;
    return navigator.share(data).catch(function (e) {
      if (e && e.name === 'AbortError') return;
      return copy();
    });
  }

  go.addEventListener('click', function () {
    if (!navigator.share) { copy(); return; }
    if (file || site) { doShare(); return; }
    go.disabled = true; say('Getting the video...');
    loadFile().then(function () { go.disabled = false; say(''); return doShare(); });
  });

  select(0, false);
  go.disabled = false;
  say(navigator.share ? (site ? 'Tap to share the message and link.' : 'Tap to share the video and message.') : 'Sharing is not available here: pick an app below or copy the message.');
  loadFile();
})();
