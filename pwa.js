/* Cài web Nước sạch KV II như ứng dụng trên điện thoại / máy tính.
   File riêng (không nằm trong index.html) nên không ảnh hưởng mã băm bảo mật của trang. */
(function () {
  'use strict';
  if (!/^https:$/.test(location.protocol) && location.hostname !== 'localhost') return;

  var KHOA_AN = 'nskv2_an_goi_y_cai';            // ngày bấm "Để sau"
  var SO_NGAY_AN = 14;
  var dangLaApp = (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true;
  var laIOS = /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  var suKienCai = null;

  // 1) Đăng ký service worker (lưu sẵn giao diện)
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function () {
      navigator.serviceWorker.register('sw.js', { scope: './' }).catch(function () {});
    });
  }

  // 1b) Có bản web mới (service worker báo): khách chưa thao tác → tự tải lại; đang dùng → hiện nút "Cập nhật"
  var luocMo = Date.now(), daThaoTac = false;
  ['pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { daThaoTac = true; }, { passive: true, capture: true }); });
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', function (ev) {
      if (!ev.data || ev.data.loai !== 'ban-moi') return;
      if (!daThaoTac && Date.now() - luocMo < 8000) { location.reload(); return; }
      if (document.getElementById('banMoi')) return;
      var k = document.createElement('div'); k.id = 'banMoi'; k.setAttribute('role', 'status');
      k.style.cssText = 'position:fixed;z-index:90;left:50%;transform:translateX(-50%);top:10px;background:#0b5394;color:#fff;border-radius:999px;padding:8px 8px 8px 16px;display:flex;gap:10px;align-items:center;font-size:14px;box-shadow:0 8px 24px rgba(0,0,0,.25);max-width:calc(100vw - 20px)';
      var t = document.createElement('span'); t.textContent = 'Web vừa có bản mới';
      var b = document.createElement('button'); b.type = 'button'; b.textContent = 'Cập nhật';
      b.style.cssText = 'border:0;border-radius:999px;background:#fff;color:#0b5394;font-weight:700;padding:6px 12px;cursor:pointer';
      b.onclick = function () { location.reload(); };
      k.appendChild(t); k.appendChild(b); document.body.appendChild(k);
    });
  }

  // 2) Mở thẳng mục khi bấm phím tắt trên biểu tượng app (#baoHong, #viPham, #traCuu)
  function moTheoDuongDan() {
    var nhom = (location.hash || '').replace('#', '');
    if (!/^(traCuu|baoHong|viPham|dichVu|tinTuc|huongDan)$/.test(nhom)) return;
    var nut = null;
    document.querySelectorAll('nav button[data-nhom="' + nhom + '"]').forEach(function (b) {
      if (!nut && b.offsetParent !== null) nut = b;
    });
    if (nut) nut.click();
    try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {}
  }
  window.addEventListener('load', function () { setTimeout(moTheoDuongDan, 400); });

  // Link Chính sách quyền riêng tư ở chân trang (cửa hàng ứng dụng yêu cầu có trong app)
  window.addEventListener('DOMContentLoaded', function () {
    var chan = document.querySelector('footer.chan');
    if (!chan || document.getElementById('linkQRT')) return;
    var cu = document.getElementById('lkRiengTu');   // v89: chân trang gọn – dùng lại link "Quyền riêng tư" sẵn có, không thêm dòng mới
    if (cu) { cu.id = 'linkQRT'; cu.href = 'chinh-sach-quyen-rieng-tu.html'; cu.textContent = 'Chính sách quyền riêng tư'; cu.removeAttribute('target'); return; }
    var d = document.createElement('div');
    var a = document.createElement('a');
    a.id = 'linkQRT';
    a.href = 'chinh-sach-quyen-rieng-tu.html';
    a.textContent = 'Chính sách quyền riêng tư';
    a.style.cssText = 'color:inherit;text-decoration:underline';
    d.appendChild(a);
    chan.appendChild(d);
  });
  window.addEventListener('hashchange', moTheoDuongDan);

  if (dangLaApp) {
    document.documentElement.classList.add('che-do-app');
    return;                                        // đã cài rồi thì không gợi ý nữa
  }

  // 11/11/2026: đã bỏ khung gợi ý cài ứng dụng (anh Phong) – hướng dẫn cài vẫn có ở Dịch vụ › Tải ứng dụng
})();
