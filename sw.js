/* Service worker – Nước sạch KV II
   Chỉ lưu sẵn GIAO DIỆN để mở nhanh / mở được khi mất mạng.
   KHÔNG lưu số liệu: mọi yêu cầu tới máy chủ Google (script.google.com…) luôn đi thẳng, không qua đây. */
var BAN = 'nskv2-giaodien-v3';
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

  // Trang chính: luôn lấy bản mới nhất; mất mạng mới dùng bản đã lưu
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req).then(function (res) {
        // chỉ lưu đúng trang chính khi tải thành công (không lưu trang lỗi 404/500)
        var p = url.pathname;
        if (res && res.ok && res.type === 'basic' && (p === '/' || p === '/index.html')) {
          var copy = res.clone();
          caches.open(BAN).then(function (c) { c.put('./index.html', copy); });
        }
        return res;
      }).catch(function () {
        return caches.match('./index.html').then(function (r) { return r || caches.match('./'); });
      })
    );
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
