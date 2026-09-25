/* Столичная печать — концепт редизайна.
   Меню, аккордеоны, единая форма заявки, фасад виджета отзывов, калькулятор визиток.
   Без зависимостей, без трекеров. */
(function () {
  'use strict';

  var $ = function (sel, root) { return (root || document).querySelector(sel); };
  var $$ = function (sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); };
  var fmt = new Intl.NumberFormat('ru-RU');
  var fmt2 = new Intl.NumberFormat('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  var rub = function (n) { return fmt.format(n) + ' ₽'; };

  /* ---------- Уведомление ---------- */
  var toastEl, toastTimer;
  function toast(text) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = text;
    requestAnimationFrame(function () { toastEl.classList.add('is-visible'); });
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3200);
  }

  // Ссылки на страницы, которых нет в концепте, — не ломаем, а объясняем
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-stub]');
    if (!a) return;
    e.preventDefault();
    toast('В концепте готовы главная и «Визитки»');
  });

  /* ---------- Раскрывашки: FAQ, подменю мобильного меню ---------- */
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-toggle]');
    if (!btn) return;
    var panel = document.getElementById(btn.getAttribute('aria-controls'));
    if (!panel) return;
    var open = btn.getAttribute('aria-expanded') === 'true';
    btn.setAttribute('aria-expanded', String(!open));
    panel.hidden = open;
  });

  /* ---------- Мега-меню «Продукция» ---------- */
  var megaBtn = $('#mega-btn');
  var mega = $('#mega');
  if (megaBtn && mega) {
    var closeTimer;
    var setMega = function (open) {
      clearTimeout(closeTimer);
      megaBtn.setAttribute('aria-expanded', String(open));
      mega.hidden = !open;
    };
    var hoverable = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
    megaBtn.addEventListener('click', function (e) {
      // мышью меню уже открыто наведением — клик не должен его закрывать
      if (hoverable && e.detail > 0) { setMega(true); return; }
      setMega(mega.hidden);
    });
    if (hoverable) {
      megaBtn.addEventListener('mouseenter', function () { setMega(true); });
      [megaBtn, mega].forEach(function (el) {
        el.addEventListener('mouseleave', function () { closeTimer = setTimeout(function () { setMega(false); }, 180); });
        el.addEventListener('mouseenter', function () { clearTimeout(closeTimer); });
      });
    }
    document.addEventListener('click', function (e) {
      if (!mega.hidden && !mega.contains(e.target) && !megaBtn.contains(e.target)) setMega(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mega.hidden) { setMega(false); megaBtn.focus(); }
    });
  }

  /* ---------- Мобильное меню ---------- */
  var burger = $('#burger');
  var mnav = $('#mnav');
  if (burger && mnav) {
    var setMenu = function (open) {
      burger.setAttribute('aria-expanded', String(open));
      burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
      $('use', burger).setAttribute('href', open ? '#i-x' : '#i-menu');
      mnav.hidden = !open;
      document.body.classList.toggle('menu-open', open);
      if (open) { var first = $('a, button', mnav); if (first) first.focus(); }
    };
    burger.addEventListener('click', function () { setMenu(mnav.hidden); });
    mnav.addEventListener('click', function (e) {
      if (e.target.closest('a[href^="#"], a[href*="#"]:not([data-stub]), [data-order]')) setMenu(false);
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !mnav.hidden) { setMenu(false); burger.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', function (m) { if (m.matches) setMenu(false); });
  }

  /* ---------- Кнопка чата: статичная, раскрывается только по клику ---------- */
  var chatBtn = $('#chat-btn');
  var chatMenu = $('#chat-menu');
  if (chatBtn && chatMenu) {
    chatBtn.addEventListener('click', function () {
      var open = chatMenu.hidden;
      chatMenu.hidden = !open;
      chatBtn.setAttribute('aria-expanded', String(open));
    });
    document.addEventListener('click', function (e) {
      if (!chatMenu.hidden && !e.target.closest('.chat')) { chatMenu.hidden = true; chatBtn.setAttribute('aria-expanded', 'false'); }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && !chatMenu.hidden) { chatMenu.hidden = true; chatBtn.setAttribute('aria-expanded', 'false'); chatBtn.focus(); }
    });
  }

  /* ---------- SEO-текст под «Подробнее» ---------- */
  $$('[data-seo-toggle]').forEach(function (btn) {
    var body = document.getElementById(btn.getAttribute('aria-controls'));
    btn.addEventListener('click', function () {
      var open = btn.getAttribute('aria-expanded') === 'true';
      btn.setAttribute('aria-expanded', String(!open));
      body.classList.toggle('is-collapsed', open);
      btn.textContent = open ? 'Подробнее' : 'Свернуть';
    });
  });

  /* ---------- Отзывы: виджет Яндекса грузится только по клику (фасад) ---------- */
  $$('[data-reviews-load]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var slot = document.getElementById(btn.getAttribute('aria-controls'));
      if (!slot.querySelector('iframe')) {
        var frame = document.createElement('iframe');
        frame.src = 'https://yandex.ru/maps-reviews-widget/109474708902?comments';
        frame.title = 'Отзывы о типографии «Столичная печать» на Яндекс Картах';
        frame.loading = 'lazy';
        frame.referrerPolicy = 'no-referrer-when-downgrade';
        $('.widget-frame', slot).appendChild(frame);
      }
      slot.hidden = false;
      btn.setAttribute('aria-expanded', 'true');
      btn.hidden = true;
      slot.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });

  /* ---------- Галерея на странице продукта ---------- */
  var galMain = $('#pgal-main');
  if (galMain) {
    $$('.pgal__thumb').forEach(function (t) {
      t.addEventListener('click', function () {
        galMain.src = t.dataset.src;
        galMain.alt = t.dataset.alt;
        $$('.pgal__thumb').forEach(function (x) { x.setAttribute('aria-pressed', String(x === t)); });
      });
    });
  }

  /* ==========================================================================
     Единая форма заявки. Никуда не отправляет данные — только демо-состояние успеха.
     ========================================================================== */
  var orderWrap = $('#order');
  var dialog = $('#order-dialog');
  var form = $('#order-form');
  var success = $('#order-success');
  var summaryBox = $('#order-summary');
  var homeSlot = orderWrap ? orderWrap.parentElement : null;
  var dialogSlot = dialog ? $('[data-form-slot]', dialog) : null;

  function setError(field, msg) {
    var input = field.querySelector('input, textarea');
    var err = field.querySelector('.field__error');
    if (err) err.textContent = msg || '';
    field.classList.toggle('is-invalid', !!msg);
    if (input) {
      if (msg) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
    }
  }

  function renderSummary(s) {
    if (!summaryBox) return;
    if (!s) { summaryBox.hidden = true; summaryBox.innerHTML = ''; form.elements.order_summary.value = ''; return; }
    var html = '<b>' + s.title + '</b><ul>' + s.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
    if (s.total) html += '<div class="sum"><span>Итого</span><strong>' + s.total + '</strong></div>';
    if (s.note) html += '<small>' + s.note + '</small>';
    summaryBox.innerHTML = html;
    summaryBox.hidden = false;
    form.elements.order_summary.value = s.title + ': ' + s.items.join('; ') + (s.total ? '; итого ' + s.total : '');
  }

  function resetOrder() {
    if (!form) return;
    form.reset();
    form.hidden = false;
    success.hidden = true;
    $$('.field, .consent', form).forEach(function (f) { setError(f, ''); });
    var fn = $('.file__name', form);
    fn.textContent = fn.dataset.empty;
    $('.file', form).classList.remove('is-highlight');
  }

  function openOrder(opts) {
    opts = opts || {};
    if (!dialog) return;
    resetOrder();
    if (orderWrap.parentElement !== dialogSlot) dialogSlot.appendChild(orderWrap);
    $('#order-title').textContent = opts.title || 'Заявка на расчёт';
    renderSummary(opts.summary || null);
    if (opts.product) form.elements.comment.value = 'Нужен расчёт: ' + opts.product + '. ';
    dialog.showModal();
    if (opts.file) {
      $('.file', form).classList.add('is-highlight');
      form.elements.file.focus();
    } else {
      form.elements.name.focus();
    }
  }

  if (dialog) {
    dialog.addEventListener('close', function () {
      if (homeSlot && homeSlot !== dialogSlot && orderWrap.parentElement !== homeSlot) homeSlot.appendChild(orderWrap);
      renderSummary(null);
    });
    dialog.addEventListener('click', function (e) { if (e.target === dialog) dialog.close(); }); // клик по подложке
    $$('[data-close]', dialog).forEach(function (b) { b.addEventListener('click', function () { dialog.close(); }); });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-order]');
    if (!btn) return;
    e.preventDefault();
    var kind = btn.getAttribute('data-order');
    if (kind === 'calc' && window.__calcSummary) {
      openOrder({ title: 'Заказ визиток', summary: window.__calcSummary(), file: btn.hasAttribute('data-file') });
      return;
    }
    openOrder({
      title: btn.getAttribute('data-title') || (btn.hasAttribute('data-file') ? 'Загрузите макет' : 'Заявка на расчёт'),
      product: btn.getAttribute('data-product'),
      file: btn.hasAttribute('data-file')
    });
  });

  if (form) {
    var fileInput = form.elements.file;
    fileInput.addEventListener('change', function () {
      var fn = $('.file__name', form);
      fn.textContent = fileInput.files.length ? fileInput.files[0].name : fn.dataset.empty;
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      var firstBad = null;
      var name = form.elements.name;
      var contact = form.elements.contact;
      var consent = form.elements.consent;

      var nameField = name.closest('.field');
      if (name.value.trim().length < 2) { setError(nameField, 'Как к вам обращаться?'); ok = false; firstBad = firstBad || name; }
      else setError(nameField, '');

      var c = contact.value.trim();
      var digits = c.replace(/\D/g, '');
      var looksOk = digits.length >= 10 || /^@[\w.]{3,}$/.test(c) || /t\.me\/|max\.ru\//i.test(c) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c);
      var contactField = contact.closest('.field');
      if (!looksOk) { setError(contactField, c ? 'Проверьте номер: нужно 10–11 цифр, или укажите @ник' : 'Укажите телефон или ник в мессенджере'); ok = false; firstBad = firstBad || contact; }
      else setError(contactField, '');

      var consentField = consent.closest('.consent');
      if (!consent.checked) { setError(consentField, 'Без согласия на обработку персональных данных мы не сможем принять заявку'); ok = false; firstBad = firstBad || consent; }
      else setError(consentField, '');

      if (!ok) { firstBad.focus(); return; }

      // Демо: данные никуда не отправляются, файл не читается.
      form.hidden = true;
      success.hidden = false;
      $('h3', success).focus();
    });

    form.elements.consent.addEventListener('change', function () {
      if (this.checked) setError(this.closest('.consent'), '');
    });

    $('#order-again').addEventListener('click', function () {
      resetOrder();
      form.elements.name.focus();
    });
  }

  /* ==========================================================================
     Калькулятор и прайс визиток — одна структура данных, цены не могут разойтись
     ========================================================================== */
  var calc = $('#calc');
  if (!calc) return;

  // Базовые цены: 90 × 50 мм, стандартная бумага 300 г/м², без ламинации (данные прайса с сайта)
  var PRICES = {
    digital: {
      label: 'Цифровая печать',
      runs: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 2000],
      rows: {
        '1+0': [375, 675, 975, 1275, 1575, 1875, 2250, 2550, 2850, 3150, 6300],
        '4+0': [400, 720, 1040, 1360, 1680, 2000, 2400, 2720, 3040, 3360, 6720],
        '4+4': [480, 855, 1235, 1615, 1995, 2375, 2850, 3230, 3610, 3990, 7980]
      }
    },
    offset: {
      label: 'Офсетная печать',
      runs: [2000, 3000, 4000, 5000, 6000, 8000, 10000, 20000],
      rows: {
        '4+0': [2243, 3270, 4279, 5525, 6676, 7789, 9388, 15226],
        '4+4': [2449, 3926, 4816, 6586, 7594, 9607, 11735, 16232]
      }
    }
  };
  var COLORS = {
    '1+0': 'чёрно-белая с одной стороны',
    '4+0': 'цветная с одной стороны',
    '4+4': 'цветная с двух сторон'
  };

  // TODO: подтвердить у владельца — надбавки за бумагу и ламинацию неизвестны, коэффициенты условные.
  var SURCHARGE = {
    paper: {
      standard: { label: 'Стандарт 300 г/м²', k: 1 },
      linen: { label: 'Лён', k: 1.25 },
      majestic: { label: 'Majestic', k: 1.5 },
      touche: { label: 'Touche Cover', k: 1.6 }
    },
    lamination: {
      none: { label: 'без ламинации', k: 1 },
      gloss: { label: 'глянцевая ламинация', k: 1.2 },
      matte: { label: 'матовая ламинация', k: 1.2 },
      softtouch: { label: 'ламинация Soft Touch', k: 1.45 }
    }
  };
  // TODO: подтвердить у владельца — сроки условные.
  var LEAD_TIME = { digital: 'от 1 дня', offset: 'от 3 дней' };
  var CALC_RUNS = { digital: [100, 200, 300, 400, 500, 600, 700, 800, 900, 1000], offset: PRICES.offset.runs };

  function methodOf(run) { return run >= 2000 ? 'offset' : 'digital'; }
  function basePrice(method, color, run) {
    var t = PRICES[method];
    var i = t.runs.indexOf(run);
    return t.rows[color] && i > -1 ? t.rows[color][i] : null;
  }
  function price(state) {
    var method = methodOf(state.run);
    var base = basePrice(method, state.color, state.run);
    var total = Math.round(base * SURCHARGE.paper[state.paper].k * SURCHARGE.lamination[state.lam].k);
    return { method: method, base: base, total: total, per: total / state.run };
  }

  // Поля калькулятора строим из тех же данных
  var runSel = $('#calc-run');
  runSel.innerHTML = ''; // в разметке — те же тиражи для работы без JS
  ['digital', 'offset'].forEach(function (m) {
    var g = document.createElement('optgroup');
    g.label = PRICES[m].label;
    CALC_RUNS[m].forEach(function (r) {
      var o = document.createElement('option');
      o.value = r; o.textContent = fmt.format(r) + ' шт.';
      g.appendChild(o);
    });
    runSel.appendChild(g);
  });
  runSel.value = '500';

  var el = {
    method: $('#calc-method'), total: $('#calc-total'), per: $('#calc-per'), lead: $('#calc-lead'),
    hint: $('#calc-hint'), hintText: $('#calc-hint-text'), c10: $('#color-10')
  };

  function state() {
    return {
      run: +runSel.value,
      color: (calc.querySelector('input[name="color"]:checked') || {}).value || '4+0',
      paper: $('#calc-paper').value,
      lam: (calc.querySelector('input[name="lam"]:checked') || {}).value || 'none'
    };
  }

  function update() {
    var s = state();
    var method = methodOf(s.run);
    // 1+0 печатается только цифрой
    el.c10.disabled = method === 'offset';
    if (method === 'offset' && s.color === '1+0') {
      $('#color-40').checked = true;
      s.color = '4+0';
      toast('Офсет печатается только в цвет — переключили на 4+0');
    }
    var p = price(s);
    el.method.innerHTML = 'Способ печати: <b>' + (method === 'offset' ? 'офсетная' : 'цифровая') + '</b> — выбирается по тиражу';
    el.total.textContent = rub(p.total);
    el.per.textContent = fmt2.format(p.per) + ' ₽ за шт.';
    el.lead.textContent = 'Срок: ' + LEAD_TIME[method];

    if (method === 'digital') {
      var oc = s.color === '1+0' ? '4+0' : s.color;
      var o = basePrice('offset', oc, 2000);
      el.hintText.innerHTML = 'От 2000 шт. выгоднее офсет: 2000 шт. ' + oc + ' — ' + rub(o) + ' (' + fmt2.format(o / 2000) + ' ₽/шт.). ';
      var b = document.createElement('button');
      b.type = 'button'; b.textContent = 'Выбрать 2000 шт.';
      b.addEventListener('click', function () { runSel.value = '2000'; update(); runSel.focus(); });
      el.hintText.appendChild(b);
      el.hint.hidden = false;
    } else {
      el.hint.hidden = true;
    }

    // подсветка той же ячейки в прайсе
    $$('.ptable td.is-active').forEach(function (td) { td.classList.remove('is-active'); });
    var cell = $('.ptable td[data-method="' + method + '"][data-color="' + s.color + '"][data-run="' + s.run + '"]');
    if (cell) cell.classList.add('is-active');
    calc.dataset.total = p.total; // для автопроверки
  }

  calc.addEventListener('change', update);
  calc.addEventListener('submit', function (e) { e.preventDefault(); });

  window.__calcSummary = function () {
    var s = state();
    var p = price(s);
    return {
      title: 'Визитки 90 × 50 мм',
      items: [
        fmt.format(s.run) + ' шт., ' + (p.method === 'offset' ? 'офсетная' : 'цифровая') + ' печать',
        s.color + ' — ' + COLORS[s.color],
        'Бумага: ' + SURCHARGE.paper[s.paper].label + ', ' + SURCHARGE.lamination[s.lam].label,
        'Срок: ' + LEAD_TIME[p.method]
      ],
      total: rub(p.total) + ' (' + fmt2.format(p.per) + ' ₽/шт.)',
      note: 'Точную стоимость подтвердит менеджер.'
    };
  };

  /* Прайс-таблицы (десктоп) */
  function buildTable(method, host) {
    var t = PRICES[method];
    var html = '<table class="ptable"><caption class="visually-hidden">' + t.label + ', визитки 90 × 50 мм, цена за тираж в рублях</caption><thead><tr><th scope="col">Тираж, шт.</th>';
    t.runs.forEach(function (r) { html += '<th scope="col">' + fmt.format(r) + '</th>'; });
    html += '</tr></thead><tbody>';
    ['1+0', '4+0', '4+4'].forEach(function (c) {
      if (!t.rows[c]) return;
      html += '<tr><th scope="row">' + c + '<small>' + COLORS[c] + '</small></th>';
      t.rows[c].forEach(function (v, i) {
        html += '<td data-method="' + method + '" data-color="' + c + '" data-run="' + t.runs[i] + '">' + fmt.format(v) + '</td>';
      });
      html += '</tr>';
    });
    host.innerHTML = html + '</tbody></table>';
  }
  buildTable('digital', $('#ptable-digital'));
  buildTable('offset', $('#ptable-offset'));

  /* Прайс (мобильный): способ → тираж → карточки */
  var pm = { method: 'digital', run: 100 };
  var chipsHost = $('#pchips');
  var cardsHost = $('#pcards');
  function renderMobilePrice() {
    var t = PRICES[pm.method];
    if (t.runs.indexOf(pm.run) < 0) pm.run = t.runs[0];
    chipsHost.innerHTML = '';
    t.runs.forEach(function (r) {
      var b = document.createElement('button');
      b.type = 'button'; b.className = 'chip';
      b.textContent = fmt.format(r);
      b.setAttribute('aria-pressed', String(r === pm.run));
      b.addEventListener('click', function () { pm.run = r; renderMobilePrice(); });
      chipsHost.appendChild(b);
    });
    var html = '';
    ['1+0', '4+0', '4+4'].forEach(function (c) {
      var v = basePrice(pm.method, c, pm.run);
      if (v === null) return;
      html += '<div class="pcard"><div><b>' + c + '</b><small>' + COLORS[c] + '</small></div><div class="pcard__price"><strong>' + rub(v) + '</strong><small>' + fmt2.format(v / pm.run) + ' ₽/шт.</small></div></div>';
    });
    cardsHost.innerHTML = html;
    $$('#pmethod button').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.method === pm.method)); });
  }
  $$('#pmethod button').forEach(function (b) {
    b.addEventListener('click', function () { pm.method = b.dataset.method; renderMobilePrice(); });
  });
  renderMobilePrice();
  update();

  // Самопроверка: микроразметка должна совпадать с прайсом
  try {
    var all = [];
    Object.keys(PRICES).forEach(function (m) { Object.keys(PRICES[m].rows).forEach(function (c) { all = all.concat(PRICES[m].rows[c]); }); });
    $$('script[type="application/ld+json"]').forEach(function (s) {
      var d = JSON.parse(s.textContent);
      if (d['@type'] === 'Product' && d.offers) {
        if (+d.offers.lowPrice !== Math.min.apply(null, all) || +d.offers.highPrice !== Math.max.apply(null, all)) {
          console.warn('JSON-LD AggregateOffer расходится с прайсом');
        }
      }
    });
  } catch (err) { /* не мешаем странице */ }
})();
