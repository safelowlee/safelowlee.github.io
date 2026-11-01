/* 법령 통합 조회 — 오프라인 지원 (판 202611020119) */
const CACHE = "osh-lookup-202611020119";
const SHELL = ["./", "index.html", "app.js", "manifest.webmanifest"];
const OPT = ["icon.svg", "maskable.svg", "icon-192.png", "icon-512.png", "maskable-512.png", "apple-touch-icon.png", "favicon-32.png"];
const fresh = u => fetch(new Request(u, {cache: "no-cache", credentials: "same-origin"})); // 서버에 새 판이 있는지 확인
const keep = (key, r) => { if(r && r.ok){ const c = r.clone(); caches.open(CACHE).then(x => x.put(key, c)); } return r; };
self.addEventListener("install", e => { e.waitUntil(caches.open(CACHE).then(c => Promise.all(SHELL.map(u => fresh(u).then(r => r.ok && c.put(u, r)).catch(() => null)).concat(OPT.map(u => c.add(u).catch(() => null))))).then(() => self.skipWaiting())); });
self.addEventListener("activate", e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener("fetch", e => {
  const u = new URL(e.request.url);
  if(e.request.method !== "GET" || u.origin !== location.origin) return; // 국가법령정보센터 조회는 항상 실시간
  const p = u.pathname;
  // 시작 화면(index.html): 저장본을 즉시 보여 줘 하얀 화면 없이 바로 로고가 뜨게 하고, 새 판은 뒤에서 받아 다음 실행부터 반영
  if(e.request.mode === "navigate" || p.endsWith("/") || p.endsWith("index.html")){
    const net = fresh("index.html").then(r => keep("index.html", r));
    e.respondWith(caches.match("index.html").then(c => c || net).catch(() => net));
    e.waitUntil(net.catch(() => null));
    return;
  }
  // 앱 본체·설정 파일: 인터넷이 되면 항상 최신판, 안 되면 저장본 (로고가 떠 있는 동안 받음)
  if(p.endsWith("app.js") || /\/app-\d+\.txt$/.test(p) || p.endsWith("manifest.webmanifest")){
    const key = p.split("/").pop();
    e.respondWith(fresh(e.request.url).then(r => keep(key, r)).catch(() => caches.match(key)));
    return;
  }
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});
