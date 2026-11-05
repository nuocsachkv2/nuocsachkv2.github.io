/* Service worker – Nước sạch KV II
   Chỉ lưu sẵn GIAO DIỆN để mở nhanh / mở được khi mất mạng.
   KHÔNG lưu số liệu: mọi yêu cầu tới máy chủ Google (script.google.com…) luôn đi thẳng, không qua đây. */
var BAN = 'nskv2-giaodien-v5';
var GIAO_DIEN = [
  './',
  './index.html',
  './manifest.webmanifest',
  './pwa.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png'
];

self.addEventListener('install', function (e) {
  e.waitUntil(
    caches.open(BAN).then(function (c) { return c.addAll(GIAO_DIEN); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys().then(function (ds) {
      return Promise.all(ds.filter(function (k) { return k !== BAN; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;                       // gửi phiếu, đăng nhập… đi thẳng
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;        // máy chủ Google, bản đồ, Zalo… đi thẳng
  if (url.pathname.indexOf('/tai/') === 0) return;        // file cài ứng dụng (APK): luôn tải thẳng, không lưu

  // Trang chính: mở NGAY bằng bản đã lưu trên máy (nhanh), đồng thời tải bản mới ở nền.
  // Bản mới khác bản đã lưu → lưu lại + báo trang "có bản mới" (trang tự tải lại nếu khách chưa thao tác).
  if (req.mode === 'navigate') {
    var p = url.pathname, trangChinh = (p === '/' || p === '/index.html');
    var taiMoi = fetch(req, { cache: 'no-cache' }).then(function (res) {
      if (!(res && res.ok && res.type === 'basic' && trangChinh)) return res;
      var luu = res.clone();
      return caches.open(BAN).then(function (c) {
        return c.match('./index.html').then(function (cu) {
          return Promise.all([luu.clone().text(), cu ? cu.text() : Promise.resolve(null)]).then(function (t) {
            if (t[0] === t[1]) return res;
            return c.put('./index.html', luu).then(function () {
              if (t[1] !== null) self.clients.matchAll({ type: 'window' }).then(function (ds) { ds.forEach(function (k) { k.postMessage({ loai: 'ban-moi' }); }); });
              return res;
            });
          });
        });
      });
    });
    if (!trangChinh) { e.respondWith(taiMoi.catch(function () { return caches.match('./index.html'); })); return; }
    e.respondWith(caches.match('./index.html').then(function (daLuu) {
      if (daLuu) { e.waitUntil(taiMoi.catch(function () {})); return daLuu; }
      return taiMoi.catch(function () { return caches.match('./'); });
    }));
    return;
  }

  // Icon, manifest, pwa.js: dùng bản đã lưu cho nhanh, ngầm tải bản mới
  e.respondWith(
    caches.match(req).then(function (daLuu) {
      var moi = fetch(req).then(function (res) {
        if (res && res.ok && res.type === 'basic') { var copy = res.clone(); caches.open(BAN).then(function (c) { c.put(req, copy); }); }
        return res;
      }).catch(function () { return daLuu; });
      return daLuu || moi;
    })
  );
});
