/* Keep the visible address at /Multiple/ while rendering the static site pages
   as a lightweight client-side shell. The virtual route is tab-local. */
(function () {
  'use strict';
  const script = document.currentScript;
  const BASE = new URL('../../', script ? script.src : location.href);
  const BASE_PATH = BASE.pathname.endsWith('/') ? BASE.pathname : BASE.pathname + '/';
  const ROUTE_KEY = 'multiplo:route';
  const MARKER = 'multiplo-route-content';
  let virtualRoute = '';
  let navigating = false;

  function cleanRoute(route) {
    route = String(route || 'index.html');
    return route.replace(/^\/+/, '') || 'index.html';
  }
  function urlFor(route) { return new URL(cleanRoute(route), BASE); }
  function routeFromUrl(url) {
    if (url.origin !== BASE.origin || !url.pathname.startsWith(BASE_PATH)) return null;
    return cleanRoute(url.pathname.slice(BASE_PATH.length) + url.search + url.hash);
  }
  function getSavedRoute() {
    try { return sessionStorage.getItem(ROUTE_KEY) || ''; } catch (_) { return ''; }
  }
  function saveRoute(route) {
    virtualRoute = cleanRoute(route);
    window.__MULTIPLO_VIRTUAL_ROUTE__ = virtualRoute;
    try { sessionStorage.setItem(ROUTE_KEY, virtualRoute); } catch (_) { }
  }
  function ensureBase(route) {
    if (!document.head) return;
    const page = urlFor(route);
    const href = new URL('.', page).href;
    let base = document.querySelector('base');
    if (!base) { base = document.createElement('base'); document.head.prepend(base); }
    base.href = href;
  }
  function currentRoute() { return virtualRoute || window.__MULTIPLO_VIRTUAL_ROUTE__ || getSavedRoute() || 'index.html'; }

  async function render(route) {
    route = cleanRoute(route);
    saveRoute(route);
    ensureBase(route);
    if (navigating) return;
    navigating = true;
    try {
      const requestUrl = urlFor(route);
      requestUrl.hash = '';
      const response = await fetch(requestUrl.href, { credentials: 'same-origin', cache: 'no-cache' });
      if (!response.ok) throw new Error('HTTP ' + response.status);
      let html = await response.text();
      const routeJson = JSON.stringify(route).replace(/</g, '\\u003c');
      const baseTag = `<base href="${new URL('.', urlFor(route)).href}">`;
      const marker = `<meta name="${MARKER}" content="${route.replace(/&/g, '&amp;').replace(/"/g, '&quot;')}">`;
      const closeScript = '</scr' + 'ipt>';
      const routeScript = `<script>window.__MULTIPLO_VIRTUAL_ROUTE__=${routeJson};${closeScript}`;
      if (/<head[^>]*>/i.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1>${baseTag}${marker}${routeScript}`);
      }
      if (!/assets\/js\/router\.js/.test(html)) {
        html = html.replace(/<head([^>]*)>/i, `<head$1><script src="${new URL('assets/js/router.js', BASE).href}"></scr` + `ipt>`);
      }
      document.open();
      document.write(html);
      document.close();
      const hash = new URL(route, BASE).hash;
      if (hash) setTimeout(() => document.getElementById(decodeURIComponent(hash.slice(1)))?.scrollIntoView(), 80);
    } catch (error) {
      navigating = false;
      console.error('não foi possível abrir a página interna:', error);
      window.Multiplo?.toast('não foi possível abrir esta página', '!');
    }
  }

  function go(destination, replace) {
    let target;
    try { target = new URL(destination, BASE); } catch (_) { return false; }
    const route = routeFromUrl(target);
    if (route === null) { location.href = target.href; return true; }
    saveRoute(route);
    const state = { ...(history.state || {}), mplRoute: route };
    history[replace ? 'replaceState' : 'pushState'](state, '', BASE.href);
    render(route);
    return true;
  }

  function params() { return new URLSearchParams(new URL(currentRoute(), BASE).search); }
  function replaceRoute(destination) {
    let target;
    try { target = new URL(destination, BASE); } catch (_) { return false; }
    const route = routeFromUrl(target);
    if (route === null) { location.href = target.href; return true; }
    saveRoute(route);
    history.replaceState({ ...(history.state || {}), mplRoute: route }, '', BASE.href);
    return true;
  }

  window.MultiploRouter = { go, replaceRoute, params, currentRoute, baseUrl: BASE.href };

  document.addEventListener('click', event => {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const anchor = event.target.closest && event.target.closest('a[href]');
    if (!anchor || anchor.hasAttribute('download') || (anchor.target && anchor.target !== '_self')) return;
    const href = anchor.getAttribute('href');
    if (!href || /^(?:https?:|mailto:|tel:|javascript:|data:|blob:)/i.test(href)) return;
    const target = new URL(href, urlFor(currentRoute()));
    if (target.origin !== BASE.origin) return;
    const route = routeFromUrl(target);
    if (route === null) return;
    event.preventDefault();
    if (target.hash && route.split('#')[0] === currentRoute().split('#')[0]) {
      document.getElementById(decodeURIComponent(target.hash.slice(1)))?.scrollIntoView({ behavior: 'smooth' });
      return;
    }
    go(target.href, false);
  });

  window.addEventListener('popstate', event => {
    const route = event.state && event.state.mplRoute || getSavedRoute() || 'index.html';
    saveRoute(route);
    history.replaceState({ ...(event.state || {}), mplRoute: route }, '', BASE.href);
    render(route);
  });

  /* Direct links still work, but normalize their address immediately. On a
     reload at the root we rehydrate the last visited static page from the tab. */
  const actual = new URL(location.href);
  const directRoute = routeFromUrl(actual);
  const marker = document.querySelector(`meta[name="${MARKER}"]`)?.content || '';
  let route;
  if (actual.pathname !== BASE_PATH) {
    route = directRoute || 'index.html';
    saveRoute(route);
    ensureBase(route);
    const meta = document.createElement('meta'); meta.name = MARKER; meta.content = route; document.head.appendChild(meta);
    history.replaceState({ ...(history.state || {}), mplRoute: route }, '', BASE.href);
  } else {
    route = marker || history.state?.mplRoute || getSavedRoute() || 'index.html';
    saveRoute(route);
    ensureBase(route);
    if (marker !== route) render(route);
  }
})();
