  var TG_BOT_TOKEN = '8966130067:AAFe7Y2yEQsRJQxbFVvIUaGHTtVKhdMecSI';
  var TG_CHAT_ID   = '-1003723003757';

document.addEventListener('DOMContentLoaded', function () {

  /* -----------------------------------------------------
     1. ПЕРЕКЛЮЧЕНИЕ ЯЗЫКОВ
     ----------------------------------------------------- */
  var T = window.BLC_TRANSLATIONS || {};
  var SUPPORTED = ['ru', 'uz', 'en', 'zh'];
  var DEFAULT_LANG = 'ru';

  function getSavedLang() {
    var saved = null;
    try { saved = localStorage.getItem('blc_lang'); } catch (e) {}
    return (saved && SUPPORTED.indexOf(saved) !== -1) ? saved : DEFAULT_LANG;
  }

  function applyLang(lang) {
    if (SUPPORTED.indexOf(lang) === -1) lang = DEFAULT_LANG;

    document.documentElement.setAttribute('lang', lang);

    // Пробегаем по всем элементам с data-i18n и подставляем перевод
    var nodes = document.querySelectorAll('[data-i18n]');
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var key = el.getAttribute('data-i18n');
      var entry = T[key];
      if (entry && entry[lang]) {
        el.textContent = entry[lang];
      } else if (entry && !entry[lang]) {
        console.warn('[i18n] Нет перевода для ключа "' + key + '" на языке "' + lang + '"');
      } else if (!entry) {
        console.warn('[i18n] Ключ "' + key + '" отсутствует в translations.js');
      }
    }

    // Обновляем подпись текущего языка в кнопке-переключателе
    var label = document.getElementById('lang-current-label');
    if (label) label.textContent = lang.toUpperCase();

    // Подсвечиваем активный пункт в выпадающем списке
    var options = document.querySelectorAll('.lang-option');
    for (var j = 0; j < options.length; j++) {
      var opt = options[j];
      if (opt.getAttribute('data-lang') === lang) {
        opt.classList.add('active');
      } else {
        opt.classList.remove('active');
      }
    }

    try { localStorage.setItem('blc_lang', lang); } catch (e) {}
  }

  // Применяем сохранённый (или дефолтный) язык сразу при загрузке
  applyLang(getSavedLang());

  var switcher = document.getElementById('lang-switcher');
  var current = document.getElementById('lang-current');

  if (switcher && current) {
    current.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = switcher.classList.toggle('open');
      current.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    var optionButtons = document.querySelectorAll('.lang-option');
    for (var k = 0; k < optionButtons.length; k++) {
      optionButtons[k].addEventListener('click', function () {
        // Живое переключение языка — без перезагрузки страницы
        applyLang(this.getAttribute('data-lang'));
        switcher.classList.remove('open');
        current.setAttribute('aria-expanded', 'false');
      });
    }

    // Клик вне переключателя — закрываем список
    document.addEventListener('click', function (e) {
      if (!switcher.contains(e.target)) {
        switcher.classList.remove('open');
        current.setAttribute('aria-expanded', 'false');
      }
    });

    // Esc — закрываем список
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        switcher.classList.remove('open');
        current.setAttribute('aria-expanded', 'false');
      }
    });
  }

  /* -----------------------------------------------------
     2. ПОЛОСА ПРОГРЕССА СКРОЛЛА + КНОПКА "НАВЕРХ"
     ----------------------------------------------------- */
  var progressBar = document.getElementById('scroll-progress');
  var backToTop = document.getElementById('back-to-top');

  function onScroll() {
    var scrollTop = window.scrollY || document.documentElement.scrollTop;
    var docHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;

    if (progressBar) progressBar.style.width = pct + '%';

    if (backToTop) {
      if (scrollTop > 500) backToTop.classList.add('visible');
      else backToTop.classList.remove('visible');
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* -----------------------------------------------------
     3. FAQ АККОРДЕОН
     ----------------------------------------------------- */
  var faqItems = document.querySelectorAll('.faq-item');
  for (var f = 0; f < faqItems.length; f++) {
    (function (item) {
      var btn = item.querySelector('.faq-question');
      if (!btn) return;
      btn.addEventListener('click', function () {
        var wasOpen = item.classList.contains('open');

        // Закрываем остальные пункты (аккордеон)
        var openItems = document.querySelectorAll('.faq-item.open');
        for (var o = 0; o < openItems.length; o++) {
          openItems[o].classList.remove('open');
          var otherBtn = openItems[o].querySelector('.faq-question');
          if (otherBtn) otherBtn.setAttribute('aria-expanded', 'false');
        }

        if (!wasOpen) {
          item.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
        }
      });
    })(faqItems[f]);
  }

  /* -----------------------------------------------------
     4. ПОЯВЛЕНИЕ БЛОКОВ ПРИ СКРОЛЛЕ (reveal)
     ----------------------------------------------------- */
  var revealSelector = '.problem-card, .service-card, .why-card, .outsource-card, .client-card, .when-card, .team-card';
  var revealNodes = document.querySelectorAll(revealSelector);
  for (var r = 0; r < revealNodes.length; r++) {
    revealNodes[r].classList.add('reveal-card');
  }

  var titleNodes = document.querySelectorAll('.section-title');
  for (var t = 0; t < titleNodes.length; t++) {
    titleNodes[t].classList.add('animate');
  }

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    var toObserve = document.querySelectorAll('.reveal-card, .section-title.animate');
    for (var v = 0; v < toObserve.length; v++) {
      observer.observe(toObserve[v]);
    }
  } else {
    // Фолбэк для очень старых браузеров — просто показать всё
    document.querySelectorAll('.reveal-card, .section-title.animate').forEach(function (el) {
      el.classList.add('revealed');
    });
  }

  /* -----------------------------------------------------
     5. ОБРАБОТКА ОШИБОК ЗАГРУЗКИ ИЗОБРАЖЕНИЙ
     ----------------------------------------------------- */
  var allImages = document.querySelectorAll('img');
  for (var im = 0; im < allImages.length; im++) {
    (function (img) {
      img.addEventListener('error', function () {
        img.classList.add('img-error');
        var wrap = img.closest('.team-photo-wrap');
        if (wrap) wrap.classList.add('img-error');
        console.warn('Не удалось загрузить изображение:', img.src);
      }, { once: true });
    })(allImages[im]);
  }

  /* -----------------------------------------------------
     6. ОТПРАВКА ФОРМЫ ЗАЯВКИ
     ----------------------------------------------------- */
  window.submitForm = function () {
    var nameEl = document.getElementById('field-name');
    var phoneEl = document.getElementById('field-phone');
    var messageEl = document.getElementById('field-message');
    var btn = document.getElementById('submit-btn');
    var fields = document.getElementById('form-fields');
    var success = document.getElementById('form-success');
    var toast = document.getElementById('toast');

    if (!nameEl || !phoneEl || !btn) return;

    var name = nameEl.value.trim();
    var phone = phoneEl.value.trim();
    var message = messageEl ? messageEl.value.trim() : '';

    if (!name) {
      nameEl.focus();
      nameEl.style.borderColor = '#c0392b';
      return;
    }
    nameEl.style.borderColor = '';

    var phonePattern = /^\+998\d{9}$/;
    if (!phonePattern.test(phone)) {
      phoneEl.focus();
      phoneEl.style.borderColor = '#c0392b';
      return;
    }
    phoneEl.style.borderColor = '';

    btn.disabled = true;
    var originalText = btn.textContent;
    btn.textContent = '...';

    function showSuccess() {
      if (fields) fields.style.display = 'none';
      if (success) success.style.display = 'block';

      if (toast) {
        toast.style.display = 'block';
        toast.style.opacity = '1';
        setTimeout(function () {
          toast.style.opacity = '0';
          setTimeout(function () { toast.style.display = 'none'; }, 400);
        }, 3000);
      }

      btn.disabled = false;
      btn.textContent = originalText;
    }

    function showError() {
      btn.disabled = false;
      btn.textContent = originalText;
      alert('Не удалось отправить заявку. Пожалуйста, позвоните нам напрямую: +998 90 888-44-66');
    }

    // Проверка, что токен и chat_id заполнены
    if (!TG_BOT_TOKEN || TG_BOT_TOKEN.indexOf('ВСТАВЬ') !== -1 ||
        !TG_CHAT_ID || TG_CHAT_ID.indexOf('ВСТАВЬ') !== -1) {
      console.error('[TG] Не заполнены TG_BOT_TOKEN / TG_CHAT_ID в script.js — заявка не отправлена.');
      showError();
      return;
    }

    var text =
      '🆕 Новая заявка с сайта BLC\n\n' +
      '👤 Имя: ' + name + '\n' +
      '📞 Телефон: ' + phone + '\n' +
      (message ? '💬 Сообщение: ' + message + '\n' : '') +
      '\n🌐 Страница: ' + window.location.href;

    fetch('https://api.telegram.org/bot' + TG_BOT_TOKEN + '/sendMessage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TG_CHAT_ID,
        text: text
      })
    })
      .then(function (res) { return res.json(); })
      .then(function (data) {
        if (data && data.ok) {
          showSuccess();
        } else {
          console.error('[TG] Ошибка ответа Telegram:', data);
          showError();
        }
      })
      .catch(function (err) {
        console.error('[TG] Ошибка сети при отправке заявки:', err);
        showError();
      });
  };

});
