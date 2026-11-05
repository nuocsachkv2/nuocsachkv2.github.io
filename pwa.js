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

  // 2) Mở thẳng mục khi bấm phím tắt trên biểu tượng app (#baoHong, #viPham, #traCuu)
  function moTheoDuongDan() {
    var nhom = (location.hash || '').replace('#', '');
    if (!/^(traCuu|baoHong|viPham|dichVu|tinTuc)$/.test(nhom)) return;
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

  function daAnGanDay() {
    try {
      var t = Number(localStorage.getItem(KHOA_AN) || 0);
      return t && (Date.now() - t) < SO_NGAY_AN * 864e5;
    } catch (e) { return false; }
  }
  function ghiAn() { try { localStorage.setItem(KHOA_AN, String(Date.now())); } catch (e) {} }

  // 3) Khung gợi ý cài
  function viTriDay() {
    var m = document.querySelector('nav.menu-duoi');
    var h = (m && getComputedStyle(m).display !== 'none') ? m.offsetHeight : 0;
    return (h + 10) + 'px';
  }

  function taoKhung(noiDung, coNutCai) {
    var cu = document.getElementById('goiYCaiApp');
    if (cu) cu.remove();
    var hep = window.innerWidth < 700;
    var k = document.createElement('div');
    k.id = 'goiYCaiApp';
    k.setAttribute('role', 'dialog');
    k.setAttribute('aria-label', 'Cài ứng dụng Nước sạch KV II');
    k.style.cssText = 'position:fixed;z-index:60;left:10px;right:' + (hep ? '76px' : 'auto') + ';bottom:' + viTriDay() +
      ';max-width:420px;background:#fff;color:#123;border:1px solid #d6e2ee;border-radius:14px;' +
      'box-shadow:0 8px 24px rgba(0,0,0,.18);padding:10px 12px;display:flex;gap:10px;align-items:center;font-size:14px;line-height:1.35';

    var anh = document.createElement('img');
    anh.src = 'icons/icon-192.png'; anh.alt = ''; anh.width = 40; anh.height = 40;
    anh.style.cssText = 'flex:0 0 40px;border-radius:10px';
    k.appendChild(anh);

    var chu = document.createElement('div');
    chu.style.cssText = 'flex:1;min-width:0';
    var t1 = document.createElement('div');
    t1.textContent = 'Cài ứng dụng Nước sạch KV II';
    t1.style.cssText = 'font-weight:700;color:#0b5394';
    var t2 = document.createElement('div');
    t2.textContent = noiDung;
    t2.style.cssText = 'font-size:13px;color:#445';
    chu.appendChild(t1); chu.appendChild(t2);
    k.appendChild(chu);

    if (coNutCai) {
      var cai = document.createElement('button');
      cai.type = 'button';
      cai.textContent = 'Cài';
      cai.style.cssText = 'flex:0 0 auto;border:0;border-radius:10px;background:#0b5394;color:#fff;font-weight:700;padding:9px 14px;font-size:14px;cursor:pointer';
      cai.addEventListener('click', function () {
        if (!suKienCai) return;
        suKienCai.prompt();
        suKienCai.userChoice.then(function (kq) {
          if (kq && kq.outcome !== 'accepted') ghiAn();
          suKienCai = null; dong();
        });
      });
      k.appendChild(cai);
    }

    var x = document.createElement('button');
    x.type = 'button';
    x.setAttribute('aria-label', 'Để sau');
    x.textContent = '×';
    x.style.cssText = 'flex:0 0 auto;border:0;background:transparent;color:#667;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer';
    x.addEventListener('click', function () { ghiAn(); dong(); });
    k.appendChild(x);

    document.body.appendChild(k);
    window.addEventListener('resize', function () { var e = document.getElementById('goiYCaiApp'); if (e) e.style.bottom = viTriDay(); });
  }
  function dong() { var e = document.getElementById('goiYCaiApp'); if (e) e.remove(); }

  // Android / máy tính (Chrome, Edge, Cốc Cốc, Samsung Internet): trình duyệt báo được phép cài
  window.addEventListener('beforeinstallprompt', function (e) {
    e.preventDefault();
    suKienCai = e;
    if (daAnGanDay()) return;
    setTimeout(function () { taoKhung('Mở nhanh từ màn hình chính, không cần gõ địa chỉ.', true); }, 2500);
  });
  window.addEventListener('appinstalled', function () { suKienCai = null; dong(); });

  // iPhone / iPad: không có nút cài tự động → hướng dẫn
  if (laIOS && !daAnGanDay()) {
    window.addEventListener('load', function () {
      setTimeout(function () {
        taoKhung('Bấm nút Chia sẻ (ô vuông có mũi tên ↑) → "Thêm vào MH chính" → Thêm.', false);
      }, 3000);
    });
  }
})();
