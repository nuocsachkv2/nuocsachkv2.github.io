/* Service worker lúc website tạm dừng để cập nhật: bỏ mọi bản giao diện đã lưu trên máy và KHÔNG chặn yêu cầu nào,
   để máy nào cũng thấy đúng trang "đang cập nhật" rồi tự nhận bản mới khi mở lại. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ds) { return Promise.all(ds.map(function (k) { return caches.delete(k); })); })
    .then(function () { return self.clients.claim(); })
    .then(function () { return self.clients.matchAll({ type: 'window' }); })
    .then(function (ds) { ds.forEach(function (k) { try { k.navigate(k.url); } catch (x) {} }); }));
});
