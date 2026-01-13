// tracking.js – minimalistisches, zustimmungsfreies Tracking (keine Cookies, keine IP, keine IDs über Tabs hinweg)

(function () {
  const ENDPOINT = 'track.php';               // <— an deinen PHP-Endpunkt anpassen
  const PAGE_PATH = location.pathname;
  const PAGE_TITLE = document.title || '';
  const REF_ORIGIN = document.referrer ? (() => { try { return new URL(document.referrer).origin; } catch { return ''; } })() : '';

  // Tab-lokale Session-ID (keine Cookies, nur für diese Registerkarte)
  const SID = (() => {
    const k = 'trk_sid';
    let v = sessionStorage.getItem(k);
    if (!v) { v = Math.random().toString(36).slice(2) + Date.now().toString(36); sessionStorage.setItem(k, v); }
    return v;
  })();

  function send(payload) {
    const body = JSON.stringify({
      path: PAGE_PATH,
      title: PAGE_TITLE,
      ref: REF_ORIGIN,
      sid: SID,
      ts: Date.now(),
      ...payload
    });
    try {
      if (navigator.sendBeacon) {
        return navigator.sendBeacon(ENDPOINT, new Blob([body], { type: 'application/json' }));
      }
      // Fallback (auch bei Navigation ok)
      return fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body,
        keepalive: true
      });
    } catch { /* schlucken */ }
  }

  // --- Pageview beim Laden
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => send({ event: 'pageview' }), { once: true });
  } else {
    send({ event: 'pageview' });
  }

  // === Auto-Track-Label für bestimmte Bereiche hinzufügen ===
document.addEventListener('DOMContentLoaded', () => {
  // Alle Gedicht-Links automatisch labeln
  document.querySelectorAll('.Gedichte a').forEach(a => {
    if (!a.hasAttribute('data-track')) {
      const text = (a.textContent || '').trim().replace(/\s+/g, ' ');
      // Optional schöneres Label:
      a.setAttribute('data-track', `Gedicht: ${text.slice(0, 120)}`);
    }
  });

  // ➕ Weitere Bereiche? Einfach weitere Selektoren:
  // document.querySelectorAll('.cta-bereich a').forEach(…)
});


  // --- Engaged Time messen (nur wenn Tab sichtbar)
  let engagedMs = 0;
  let lastVisibleAt = document.visibilityState === 'visible' ? performance.now() : null;

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && lastVisibleAt != null) {
      engagedMs += performance.now() - lastVisibleAt;
      lastVisibleAt = null;
    } else if (document.visibilityState === 'visible') {
      lastVisibleAt = performance.now();
    }
  });

  // Beim Verlassen finalen Wert senden
  window.addEventListener('pagehide', () => {
    if (lastVisibleAt != null) engagedMs += performance.now() - lastVisibleAt;
    send({ event: 'engagement', engaged_ms: Math.round(engagedMs) });
  });

  // --- Click-Tracking NUR für Elemente mit data-track
  let lastClickAt = 0;
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-track]');
    if (!el) return;

    // Entprellen
    const now = Date.now();
    if (now - lastClickAt < 300) return;
    lastClickAt = now;

    const label = el.getAttribute('data-track') || (el.textContent || '').trim().slice(0, 120);
    let dest = '';
    if (el.tagName === 'A') {
      const href = el.getAttribute('href') || '';
      // auch mailto/tel mitnehmen:
      if (/^(mailto:|tel:)/i.test(href)) dest = href;
      else {
        try { dest = new URL(href, location.href).pathname; } catch { dest = href; }
      }
    }

    send({ event: 'click', label, dest });
  }, true);
})();
