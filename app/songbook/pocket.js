// Pocket Studio layer for the Tabbycat Songbook: room switching, the free song limit,
// the shared one-time unlock, Paste import for phones, and Android share-to-Songbook.
(() => {
  const FREE_SONG_LIMIT = 10;
  let unlocked = false;
  let stripeLink = '#';
  let price = '$25';

  const countSongs = () => songs.filter(s => !(s.tags || []).includes('demo')).length;
  const canAdd = n => unlocked || countSongs() + n <= FREE_SONG_LIMIT;

  /* ---------- Room switching ---------- */
  const studioLink = document.createElement('a');
  studioLink.className = 'btn ghost room-link';
  studioLink.href = '../';
  studioLink.textContent = '← STUDIO';
  $('.brand-zone')?.prepend(studioLink);

  const mobileNav = $('.mobile-nav');
  if (mobileNav) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = 'Studio';
    b.setAttribute('aria-label', 'Go to Pocket Studio tools');
    b.onclick = () => { location.href = '../'; };
    mobileNav.prepend(b);
  }

  /* ---------- Free-limit meter ---------- */
  const meter = document.createElement('button');
  meter.type = 'button';
  meter.className = 'limit-meter';
  meter.onclick = () => { if (!unlocked) paywall('Free covers ' + FREE_SONG_LIMIT + ' songs.'); };
  $('.library-head')?.append(meter);
  function renderMeter() {
    if (unlocked) { meter.textContent = 'UNLIMITED'; meter.classList.add('owned'); return; }
    meter.classList.remove('owned');
    meter.textContent = Math.min(countSongs(), FREE_SONG_LIMIT) + '/' + FREE_SONG_LIMIT + ' FREE';
  }
  const origRenderList = renderList;
  renderList = function () { origRenderList(); renderMeter(); };

  /* ---------- Paywall ---------- */
  const wall = document.createElement('div');
  wall.className = 'modal-backdrop hidden';
  wall.id = 'paywall';
  wall.innerHTML = `
    <div class="modal paywall" role="dialog" aria-modal="true" aria-labelledby="paywallTitle">
      <div class="modal-topline"></div>
      <div class="module-label">POCKET STUDIO</div>
      <h2 id="paywallTitle">SONGBOOK FULL</h2>
      <p id="paywallReason"></p>
      <ul class="paywall-list">
        <li>Unlimited songs in the Songbook</li>
        <li>Save audio and video from every Studio tool</li>
        <li>Works offline. No account. No subscription.</li>
      </ul>
      <p class="paywall-price"><b id="paywallPrice">$25</b> once. It's yours.</p>
      <div class="modal-actions paywall-actions">
        <button class="btn" type="button" id="paywallLater">NOT NOW</button>
        <a class="btn" id="paywallKey" href="../?unlock=1#studio-card">I HAVE A KEY</a>
        <a class="btn primary" id="paywallBuy" href="#">UNLOCK</a>
      </div>
    </div>`;
  document.body.appendChild(wall);
  const closeWall = () => wall.classList.add('hidden');
  $('#paywallLater').onclick = closeWall;
  wall.addEventListener('click', e => { if (e.target === wall) closeWall(); });
  function paywall(reason) {
    $('#paywallReason').textContent = reason + ' Unlock once to keep going.';
    wall.classList.remove('hidden');
  }

  // Gate every way a song gets added. Capture phase on document runs before the app's own handlers.
  document.addEventListener('click', e => {
    if (unlocked) return;
    if (e.target.closest('#newSongBtn') && !canAdd(1)) {
      e.stopPropagation(); e.preventDefault();
      paywall('Your free Songbook holds ' + FREE_SONG_LIMIT + ' songs.');
    } else if (e.target.closest('#confirmImport') && !canAdd(1)) {
      e.stopPropagation(); e.preventDefault();
      closeImport();
      paywall('Your free Songbook holds ' + FREE_SONG_LIMIT + ' songs.');
    }
  }, true);

  // JSON backup import replaces the songbook, so check how many songs the file holds first.
  const jsonInput = $('#jsonInput');
  const origJson = jsonInput?.onchange;
  document.addEventListener('change', async e => {
    if (e.target !== jsonInput || unlocked) return;
    e.stopPropagation();
    const file = jsonInput.files?.[0];
    if (!file) return;
    let n = 0;
    try {
      const data = JSON.parse(await file.text());
      const list = Array.isArray(data) ? data : data.songs;
      n = Array.isArray(list) ? list.filter(s => !(s.tags || []).includes('demo')).length : 0;
    } catch (err) { /* let the app report the bad file */ }
    if (n > FREE_SONG_LIMIT) {
      jsonInput.value = '';
      paywall('That backup has ' + n + ' songs, and free covers ' + FREE_SONG_LIMIT + '.');
      return;
    }
    origJson && origJson.call(jsonInput, { target: jsonInput });
  }, true);

  /* ---------- Paste import (the phone way to bring songs in) ---------- */
  const pasteBox = document.createElement('div');
  pasteBox.className = 'modal-backdrop hidden';
  pasteBox.id = 'pasteModal';
  pasteBox.innerHTML = `
    <div class="modal" role="dialog" aria-modal="true" aria-labelledby="pasteTitle">
      <div class="modal-topline"></div>
      <div class="module-label">BRING A SONG IN</div>
      <h2 id="pasteTitle">PASTE SONG</h2>
      <p>Paste a tab or chord sheet. Chords stay above the lyrics, spacing is kept.</p>
      <div class="field"><textarea id="pasteText" spellcheck="false" placeholder="[Verse 1]&#10;C              G&#10;Paste the song here"></textarea></div>
      <div class="modal-actions"><button class="btn" type="button" id="pasteCancel">CANCEL</button><button class="btn primary" type="button" id="pasteNext">NEXT</button></div>
    </div>`;
  document.body.appendChild(pasteBox);
  const closePaste = () => pasteBox.classList.add('hidden');
  $('#pasteCancel').onclick = closePaste;
  pasteBox.addEventListener('click', e => { if (e.target === pasteBox) closePaste(); });

  function guessTitle(body) {
    for (const line of body.split(/\r?\n/)) {
      const t = line.trim();
      if (!t) continue;
      if (SECTION_RE.test(t) || TAB_RE.test(t) || isChordLine(t) || t.length > 60) return '';
      return t.replace(/\s+(chords|tab|tabs|lyrics)$/i, '');
    }
    return '';
  }
  function queuePasted(body, label, title) {
    body = String(body || '').replace(/\r\n/g, '\n').replace(/^\n+|\s+$/g, '');
    if (!body) { toast('Nothing to paste.'); return; }
    let t = title || guessTitle(body), artist = '';
    const split = t.split(/\s+(?:-|–|by)\s+/i);
    if (split.length === 2) { [t, artist] = split.map(x => x.trim()); }
    importQueue.push({ body, fileName: label, source: label, title: t, artist, key: firstChord(body), capo: '0' });
    if (!pendingImport) showNextImport();
  }
  $('#pasteNext').onclick = () => { const v = $('#pasteText').value; closePaste(); $('#pasteText').value = ''; queuePasted(v, 'Pasted song'); };
  $('#pasteBtn').onclick = async () => {
    if (!canAdd(1)) { paywall('Your free Songbook holds ' + FREE_SONG_LIMIT + ' songs.'); return; }
    try {
      const text = navigator.clipboard?.readText ? await navigator.clipboard.readText() : '';
      if (text && text.trim().split('\n').length > 1) { queuePasted(text, 'Pasted song'); return; }
    } catch (e) { /* clipboard blocked: fall back to the paste box */ }
    pasteBox.classList.remove('hidden');
    setTimeout(() => $('#pasteText').focus(), 40);
  };

  /* ---------- Shared from another app (Android share sheet) ---------- */
  const q = new URLSearchParams(location.search);
  const shared = q.get('text') || '';
  if (shared.trim()) {
    history.replaceState(null, '', location.pathname);
    setTimeout(() => queuePasted(shared, 'Shared song', q.get('title') || ''), 60);
  }

  /* ---------- Unlock state ---------- */
  renderMeter();
  import('../license.js').then(async L => {
    stripeLink = L.STRIPE_LINK; price = L.PRICE;
    $('#paywallBuy').href = stripeLink;
    $('#paywallBuy').textContent = 'UNLOCK ' + price;
    $('#paywallPrice').textContent = price;
    unlocked = await L.isUnlocked();
    renderMeter();
  }).catch(() => {});
})();
