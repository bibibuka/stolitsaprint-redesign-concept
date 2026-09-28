/* Столичная печать — концепт, вариант 2 («бенто»).
   Быстрый калькулятор, фольга с бликом, история тиража при прокрутке, лупа печатника,
   «приводка» заголовков, статус «открыто/закрыто».
   Меню, форма заявки, аккордеоны и фасад отзывов — общие, из ../assets/js/main.js. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmt = new Intl.NumberFormat('ru-RU');
  var fmt2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rub = function (n) { return fmt.format(n) + ' ₽'; };
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  /* ==========================================================================
     Быстрый расчёт визиток в первом экране
     ========================================================================== */
  // Цены — из прайса /vizitki/ (те же, что PRICES в main.js): до 1000 шт. цифра, от 2000 — офсет.
  // TODO: при переносе брать из общего источника с main.js, чтобы прайс не дублировался.
  var QC_PRICES = {
    '4+0': { 100: 400, 300: 1040, 500: 1680, 1000: 3360, 2000: 2243, 5000: 5525 },
    '4+4': { 100: 480, 300: 1235, 500: 1995, 1000: 3990, 2000: 2449, 5000: 6586 }
  };
  // TODO: подтвердить у владельца — сроки условные (как LEAD_TIME в main.js).
  var LEAD = { digital: 'от 1 дня', offset: 'от 3 дней' };
  var COLORS = { '4+0': 'цветная с одной стороны', '4+4': 'цветная с двух сторон' };

  var qc = $('#qc');
  if (qc) {
    var totalEl = $('#qc-total');
    var metaEl = $('#qc-meta');
    var hintEl = $('#qc-hint');
    var srEl = $('#qc-sr');
    var shown = 0;
    var raf;

    var qcState = function () {
      return {
        run: +qc.querySelector('input[name="qc-run"]:checked').value,
        color: qc.querySelector('input[name="qc-color"]:checked').value
      };
    };
    var qcPrice = function (s) {
      var method = s.run >= 2000 ? 'offset' : 'digital';
      var total = QC_PRICES[s.color][s.run];
      return { method: method, total: total, per: total / s.run };
    };
    // Цифра «докручивается» до новой цены
    var countTo = function (to) {
      cancelAnimationFrame(raf);
      if (reduce || !shown) { shown = to; totalEl.textContent = rub(to); return; }
      var from = shown;
      var t0 = performance.now();
      var tick = function (t) {
        var k = Math.min(1, (t - t0) / 420);
        k = 1 - Math.pow(1 - k, 3);
        shown = Math.round(from + (to - from) * k);
        totalEl.textContent = rub(shown);
        if (k < 1) raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    };
    var qcUpdate = function () {
      var s = qcState();
      var p = qcPrice(s);
      var method = p.method === 'offset' ? 'офсетная' : 'цифровая';
      countTo(p.total);
      metaEl.textContent = fmt2.format(p.per) + ' ₽/шт. · ' + method + ' печать · ' + LEAD[p.method];
      srEl.textContent = 'Итого ' + rub(p.total) + ', ' + fmt2.format(p.per) + ' ₽ за штуку';
      hintEl.textContent = p.method === 'offset'
        ? 'Большие тиражи печатаем офсетом — за штуку выходит дешевле.'
        : 'От 2000 шт. печатаем офсетом — за штуку выходит дешевле.';
    };
    qc.addEventListener('change', qcUpdate);
    qc.addEventListener('submit', function (e) { e.preventDefault(); });
    qcUpdate();

    // Кнопки «Заказать» и «Макет» (data-order="calc") — main.js берёт отсюда параметры для формы
    window.__calcSummary = function () {
      var s = qcState();
      var p = qcPrice(s);
      return {
        title: 'Визитки 90 × 50 мм',
        items: [
          fmt.format(s.run) + ' шт., ' + (p.method === 'offset' ? 'офсетная' : 'цифровая') + ' печать',
          s.color + ' — ' + COLORS[s.color],
          'Бумага: стандарт 300 г/м², без ламинации',
          'Срок: ' + LEAD[p.method]
        ],
        total: rub(p.total) + ' (' + fmt2.format(p.per) + ' ₽/шт.)',
        note: 'Точную стоимость подтвердит менеджер.'
      };
    };
  }

  /* ==========================================================================
     Визитка с фольгой: наклон и блик идут за курсором.
     На сенсорных экранах — плавная автоанимация в CSS.
     ========================================================================== */
  var foil = $('#foil');
  var card = $('#bcard');
  if (foil && card && finePointer && !reduce) {
    var fr;
    foil.addEventListener('pointermove', function (e) {
      var r = foil.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width;
      var y = (e.clientY - r.top) / r.height;
      cancelAnimationFrame(fr);
      fr = requestAnimationFrame(function () {
        card.style.setProperty('--ry', ((x - 0.5) * 34).toFixed(1) + 'deg');
        card.style.setProperty('--rx', ((0.5 - y) * 22).toFixed(1) + 'deg');
        card.style.setProperty('--mx', (x * 100).toFixed(1) + '%');
        card.style.setProperty('--my', (y * 100).toFixed(1) + '%');
      });
    });
    foil.addEventListener('pointerleave', function () {
      cancelAnimationFrame(fr);
      ['--rx', '--ry', '--mx', '--my'].forEach(function (p) { card.style.removeProperty(p); });
    });
  }

  /* ==========================================================================
     История тиража: лист проходит путь «макет → цветоделение → печать → резка → доставка».
     Четыре формы C, M, Y, K наложены с multiply — при совмещении дают цветной оттиск.
     ========================================================================== */
  var press = $('#press');
  var stage = $('#stage');
  if (press && stage) {
    var shapes = '<b class="s1"></b><b class="s2"></b><b class="s3"></b><b class="s4"></b><b class="s5"></b>';
    var cells = function (withShapes) {
      var h = '';
      for (var i = 0; i < 9; i++) h += '<i class="cell" style="--i:' + i + '">' + (withShapes ? shapes : '') + '</i>';
      return h;
    };
    var html = '<div class="layer layer--bg"></div><div class="layer grid9 cells">' + cells(false) + '</div>';
    ['y', 'm', 'c', 'k'].forEach(function (n) {
      html += '<div class="layer grid9 plate plate--' + n + '" data-ink="' + n.toUpperCase() + '">' + cells(true) + '</div>';
    });
    html += '<span class="press__sweep"></span>' +
      '<span class="press__chip press__file"><svg class="i i--sm"><use href="#i-file"/></svg>vizitki_90x50.pdf</span>' +
      '<span class="press__chip press__deliv"><svg class="i i--sm"><use href="#i-truck"/></svg>В день готовности</span>';
    press.innerHTML = html;

    var num = $('#stage-num');
    var capEl = $('#stage-text');
    var steps = $$('.step');
    var setStep = function (li) {
      var n = li.getAttribute('data-step');
      if (press.getAttribute('data-step') === n) return;
      press.setAttribute('data-step', n);
      stage.setAttribute('data-step', n);
      num.textContent = '0' + n;
      capEl.textContent = li.getAttribute('data-cap');
      steps.forEach(function (s) { s.classList.toggle('is-active', s === li); });
    };
    if ('IntersectionObserver' in window) {
      // Активный шаг — тот, что пересекает линию чтения (на телефоне она ниже: сверху прилипает сцена)
      var narrow = window.matchMedia('(max-width: 899px)').matches;
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) setStep(en.target); });
      }, { rootMargin: narrow ? '-64% 0px -30% 0px' : '-48% 0px -48% 0px' });
      steps.forEach(function (s) { io.observe(s); });
    }
  }

  /* ==========================================================================
     Лупа печатника: увеличенный фрагмент фото с растровой сеткой
     ========================================================================== */
  if (finePointer) {
    var ZOOM = 2.4;
    $$('.work').forEach(function (fig) {
      var img = $('img', fig);
      var lens = null;
      fig.addEventListener('pointermove', function (e) {
        if (!img.complete || !img.naturalWidth) return;
        if (!lens) {
          lens = document.createElement('span');
          lens.className = 'loupe';
          lens.setAttribute('aria-hidden', 'true');
          lens.style.backgroundImage = 'url("' + (img.currentSrc || img.src) + '")';
          fig.appendChild(lens);
          fig.classList.add('has-loupe');
        }
        var r = fig.getBoundingClientRect();
        var R = lens.offsetWidth / 2;
        var x = e.clientX - r.left;
        var y = e.clientY - r.top;
        // картинка вписана через object-fit: cover — считаем её реальный размер и сдвиг
        var s = Math.max(r.width / img.naturalWidth, r.height / img.naturalHeight);
        var dw = img.naturalWidth * s;
        var dh = img.naturalHeight * s;
        var ox = (r.width - dw) / 2;
        var oy = (r.height - dh) / 2;
        lens.style.transform = 'translate(' + (x - R) + 'px,' + (y - R) + 'px)';
        lens.style.backgroundSize = (dw * ZOOM) + 'px ' + (dh * ZOOM) + 'px';
        lens.style.backgroundPosition = (R - (x - ox) * ZOOM) + 'px ' + (R - (y - oy) * ZOOM) + 'px';
      });
      fig.addEventListener('pointerleave', function () {
        if (lens) { lens.remove(); lens = null; }
        fig.classList.remove('has-loupe');
      });
    });
  }

  /* ==========================================================================
     «Приводка»: заголовок при появлении собирается из сдвинутых C, M, Y
     ========================================================================== */
  var regs = $$('.reg');
  if (regs.length && !reduce && 'IntersectionObserver' in window) {
    var rio = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        en.target.classList.add('is-in');
        rio.unobserve(en.target);
      });
    }, { threshold: 0.8 });
    regs.forEach(function (h) { rio.observe(h); });
  }

  /* ==========================================================================
     Открыто / закрыто — по московскому времени (UTC+3), без учёта праздников
     ========================================================================== */
  var live = $$('[data-live-status]');
  if (live.length) {
    var now = new Date();
    var msk = new Date(now.getTime() + (now.getTimezoneOffset() + 180) * 60000);
    var day = msk.getDay();
    var min = msk.getHours() * 60 + msk.getMinutes();
    var weekday = day >= 1 && day <= 5;
    var open = weekday && min >= 600 && min < 1140;
    var text;
    if (open) text = 'Сейчас открыто · до 19:00';
    else if (weekday && min < 600) text = 'Сейчас закрыто · откроемся в 10:00';
    else if (day >= 1 && day <= 4) text = 'Сейчас закрыто · откроемся завтра в 10:00';
    else text = 'Сейчас закрыто · откроемся в понедельник в 10:00';
    live.forEach(function (el) {
      var t = $('[data-live-text]', el);
      el.classList.toggle('is-open', open);
      if (!t) return;
      if (el.hasAttribute('data-short')) t.textContent = open ? 'Открыто до 19:00' : 'Пн–Пт 10:00–19:00';
      else t.textContent = text;
    });
  }
})();
