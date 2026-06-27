/* =====================================================
   LANGUAGE SYSTEM — работает через data-i18n + window.BLC_TRANSLATIONS
   ===================================================== */
let currentLang = 'ru';

const LANG_LABELS = { ru: 'RU', uz: 'UZ', en: 'EN', zh: '中文' };

function applyTranslations(lang) {
  const dict = window.BLC_TRANSLATIONS || {};
  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const entry = dict[key];
    if (!entry) return;
    const val = entry[lang] || entry.ru;
    if (!val) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.placeholder = val;
    } else {
      el.textContent = val;
    }
  });
}

function setLang(lang) {
  if (!LANG_LABELS[lang]) lang = 'ru';
  currentLang = lang;

  applyTranslations(lang);

  const label = document.getElementById('lang-current-label');
  if (label) label.textContent = LANG_LABELS[lang];

  document.querySelectorAll('.lang-option').forEach(opt => {
    opt.classList.toggle('active', opt.getAttribute('data-lang') === lang);
  });

  document.documentElement.lang = lang === 'zh' ? 'zh' : lang;
  try { localStorage.setItem('site-lang', lang); } catch (e) {}
}

function initLangSwitcher() {
  const switcher = document.getElementById('lang-switcher');
  const trigger = document.getElementById('lang-current');
  if (!switcher || !trigger) return;

  function closeSwitcher() {
    switcher.classList.remove('open');
    trigger.setAttribute('aria-expanded', 'false');
  }
  function openSwitcher() {
    switcher.classList.add('open');
    trigger.setAttribute('aria-expanded', 'true');
  }

  trigger.addEventListener('click', function (e) {
    e.stopPropagation();
    if (switcher.classList.contains('open')) closeSwitcher();
    else openSwitcher();
  });

  switcher.querySelectorAll('.lang-option').forEach(btn => {
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      const lang = this.getAttribute('data-lang');
      setLang(lang);
      closeSwitcher();
    });
  });

  document.addEventListener('click', function (e) {
    if (!switcher.contains(e.target)) closeSwitcher();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSwitcher();
  });
}

/* =====================================================
   PHONE INPUT
   ===================================================== */
const PHONE_PREFIX = '+998';

function initPhoneInput() {
  document.querySelectorAll('input[type="tel"], #field-phone').forEach(input => {
    if (!input.value.startsWith(PHONE_PREFIX)) input.value = PHONE_PREFIX;
    input.addEventListener('input', function () {
      let digits = this.value.replace(/\D/g, '');
      if (digits.startsWith('998')) digits = digits.slice(3);
      this.value = PHONE_PREFIX + digits.substring(0, 9);
    });
    input.addEventListener('keydown', function (e) {
      const pos = this.selectionStart;
      if ((e.key === 'Backspace' || e.key === 'Delete') &&
          pos <= PHONE_PREFIX.length && this.selectionEnd <= PHONE_PREFIX.length) {
        e.preventDefault();
      }
    });
    input.addEventListener('click', function () {
      if (this.selectionStart < PHONE_PREFIX.length)
        this.setSelectionRange(this.value.length, this.value.length);
    });
    input.addEventListener('focus', function () {
      if (!this.value.startsWith(PHONE_PREFIX)) this.value = PHONE_PREFIX;
      setTimeout(() => this.setSelectionRange(this.value.length, this.value.length), 0);
    });
  });
}

/* =====================================================
   FAQ TOGGLE
   ===================================================== */
function toggleFaq(element) {
  const item = element.closest('.faq-item');
  if (!item) return;
  const isOpen = item.classList.contains('open');
  document.querySelectorAll('.faq-item').forEach(i => {
    i.classList.remove('open');
    const btn = i.querySelector('.faq-question');
    if (btn) btn.setAttribute('aria-expanded', 'false');
  });
  if (!isOpen) {
    item.classList.add('open');
    element.setAttribute('aria-expanded', 'true');
  }
}

/* =====================================================
   FORM SUBMISSION
   ===================================================== */
async function submitForm() {
  const nameInput  = document.getElementById('field-name');
  const phoneInput = document.getElementById('field-phone');
  const msgInput   = document.getElementById('field-message');
  const submitBtn  = document.getElementById('submit-btn');
  if (!nameInput || !phoneInput) return;

  const name  = nameInput.value.trim();
  const phone = phoneInput.value.trim();
  const msg   = msgInput ? msgInput.value.trim() : '';

  if (!name) { showFieldError(nameInput, currentLang === 'uz' ? 'Ismingizni kiriting' : 'Введите ваше имя'); return; }
  if (!phone || phone.length < PHONE_PREFIX.length + 9) {
    showFieldError(phoneInput, currentLang === 'uz' ? "Telefon raqamini to'liq kiriting" : 'Введите полный номер телефона');
    return;
  }

  if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = currentLang === 'uz' ? 'Yuborilmoqda...' : 'Отправка...'; }

  const text = [
    '🔔 <b>Новая заявка с сайта Business Law Consulting</b>', '',
    `👤 Имя: ${escHtml(name)}`, `📞 Телефон: ${escHtml(phone)}`,
    `💬 Сообщение: ${msg ? escHtml(msg) : '—'}`
  ].join('\n');

  const TOKEN   = '8830532011:AAGJ6A7LZmmWT1c2Qi2YxZRJHpOd62FNN1w';
  const CHAT_ID = '-5102240344';

  try {
    const res  = await fetch(`https://api.telegram.org/bot${TOKEN}/sendMessage`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: CHAT_ID, text, parse_mode: 'HTML' })
    });
    const data = await res.json();
    if (data.ok) {
      nameInput.value  = '';
      phoneInput.value = PHONE_PREFIX;
      if (msgInput) msgInput.value = '';
      const success = document.getElementById('form-success');
      const fields  = document.getElementById('form-fields');
      if (success && fields) {
        fields.style.display  = 'none';
        success.style.display = 'block';
        setTimeout(() => { success.style.display = 'none'; fields.style.display = 'block'; }, 4000);
      } else {
        showToast(currentLang === 'uz' ? '✓ Ariza yuborildi!' : '✓ Заявка отправлена!');
      }
    } else { showToast('Ошибка отправки. Позвоните: +998 90 888-44-66'); }
  } catch (e) { showToast('Ошибка соединения. Позвоните: +998 90 888-44-66'); }
  finally {
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = currentLang === 'uz' ? 'Ariza yuborish' : 'Отправить заявку';
    }
  }
}

function showFieldError(input, message) {
  input.style.borderColor = '#e53e3e';
  input.focus();
  input.addEventListener('input', function onIn() { input.style.borderColor = ''; input.removeEventListener('input', onIn); });
  showToast('⚠️ ' + message);
}
function escHtml(str) {
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* =====================================================
   TOAST
   ===================================================== */
function showToast(message) {
  let toast = document.getElementById('toast');
  if (!toast) { toast = document.createElement('div'); toast.id = 'toast'; document.body.appendChild(toast); }
  toast.textContent = message;
  toast.style.display = 'block';
  toast.style.opacity = '1';
  clearTimeout(toast._t);
  toast._t = setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => { toast.style.display = 'none'; }, 400);
  }, 3500);
}

/* =====================================================
   SCROLL PROGRESS BAR
   ===================================================== */
function initProgressBar() {
  const bar = document.getElementById('scroll-progress');
  if (!bar) return;
  window.addEventListener('scroll', () => {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.width = (docH > 0 ? (window.scrollY / docH) * 100 : 0) + '%';
  }, { passive: true });
}

/* =====================================================
   SCROLL REVEAL — карточки fade+slide вверх
   ===================================================== */
function initScrollReveal() {
  const cards = document.querySelectorAll(
    '.service-card, .why-card, .problem-card, .outsource-card, .when-card, .client-card, .faq-item'
  );
  cards.forEach((el, i) => {
    el.classList.add('reveal-card');
    el.style.transitionDelay = (i % 6) * 0.07 + 's';
  });

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('revealed');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
  cards.forEach(el => obs.observe(el));

  /* Section titles */
  document.querySelectorAll('.section-title').forEach(el => {
    el.classList.add('animate');
    const obs2 = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('revealed'); obs2.unobserve(e.target); }
      });
    }, { threshold: 0.3 });
    obs2.observe(el);
  });
}

/* =====================================================
   COUNTER ANIMATION
   ===================================================== */
function animateCounter(el, target, suffix, duration) {
  const start = performance.now();
  const step = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(eased * target) + suffix;
    if (p < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function initCounters() {
  document.querySelectorAll('.why-card h3, .outsource-card .outsource-num').forEach(el => {
    const text = el.textContent.trim();
    const match = text.match(/^(\d+)(\+?.*)$/);
    if (!match) return;
    const target = parseInt(match[1]);
    const suffix = match[2] || '';
    el.dataset.counterDone = '0';
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting && el.dataset.counterDone === '0') {
          el.dataset.counterDone = '1';
          animateCounter(el, target, suffix, 1200);
          obs.unobserve(el);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(el);
  });
}

/* =====================================================
   TYPING EFFECT — повторяется каждые 7 сек
   ===================================================== */
function initTyping() {
  const heading = document.querySelector('.hero-heading');
  if (!heading) return;

  const phrases = {
    ru: [
      'Юридическое сопровождение бизнеса в Ташкенте и по всему Узбекистану',
      'Защита ваших интересов в судах и переговорах',
      'Договоры, корпоративное право, налоговые споры',
      'Команда юристов — вместо одного штатного специалиста',
    ],
    uz: [
      'Toshkent va butun O\'zbekiston bo\'ylab biznesni yuridik qo\'llab-quvvatlash',
      'Sud va muzokaralarda manfaatlaringizni himoya qilish',
      'Shartnamalar, korporativ huquq, soliq nizolari',
      'Yuristlar jamoasi — bitta shtatli mutaxassis o\'rniga',
    ],
    en: [
      'Legal support for business in Tashkent and throughout Uzbekistan',
      'Protecting your interests in courts and negotiations',
      'Contracts, corporate law, tax disputes',
      'A team of lawyers — instead of one in-house specialist',
    ],
    zh: [
      '塔什干及乌兹别克斯坦全境企业法律服务',
      '在法庭和谈判中维护您的利益',
      '合同、公司法、税务纠纷',
      '律师团队——而非一名内部专家',
    ]
  };

  let phraseIndex = 0;
  let typing = false;

  function typePhrase(text, onDone) {
    typing = true;
    heading.textContent = '';
    const cursor = document.createElement('span');
    cursor.className = 'typing-cursor';
    heading.appendChild(cursor);
    let i = 0;
    const timer = setInterval(() => {
      cursor.insertAdjacentText('beforebegin', text[i]);
      i++;
      if (i >= text.length) {
        clearInterval(timer);
        typing = false;
        if (onDone) setTimeout(onDone, 100);
      }
    }, 36);
  }

  function eraseText(onDone) {
    typing = true;
    const timer = setInterval(() => {
      const txt = heading.textContent;
      if (txt.length === 0) {
        clearInterval(timer);
        typing = false;
        if (onDone) onDone();
        return;
      }
      heading.textContent = txt.slice(0, -1);
    }, 18);
  }

  function cycle() {
    const lang = currentLang in phrases ? currentLang : 'ru';
    const list = phrases[lang];
    phraseIndex = (phraseIndex + 1) % list.length;
    eraseText(() => {
      setTimeout(() => typePhrase(list[phraseIndex], () => {
        setTimeout(cycle, 7000);
      }), 300);
    });
  }

  /* Первый запуск — после прелоадера */
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const lang = currentLang in phrases ? currentLang : 'ru';
        setTimeout(() => typePhrase(phrases[lang][0], () => {
          setTimeout(cycle, 7000);
        }), 600);
        obs.unobserve(e.target);
      }
    });
  }, { threshold: 0.3 });
  obs.observe(heading);
}

/* =====================================================
   BACK TO TOP
   ===================================================== */
function initBackToTop() {
  const btn = document.getElementById('back-to-top');
  if (!btn) return;
  window.addEventListener('scroll', () => {
    btn.classList.toggle('visible', window.scrollY > 400);
  }, { passive: true });
  btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
}

/* =====================================================
   HERO PARALLAX
   ===================================================== */
function initParallax() {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(max-width: 768px)').matches) return;
  let rafId = null;
  hero.addEventListener('mousemove', (e) => {
    if (rafId) return;
    rafId = requestAnimationFrame(() => {
      const rect = hero.getBoundingClientRect();
      const dx = (e.clientX - rect.left - rect.width / 2) / rect.width;
      const dy = (e.clientY - rect.top  - rect.height / 2) / rect.height;
      hero.style.backgroundPosition = `${50 + dx * 7}% ${50 + dy * 7}%`;
      rafId = null;
    });
  });
  hero.addEventListener('mouseleave', () => { hero.style.backgroundPosition = ''; });
}

/* =====================================================
   FLOATING STATS — живые числа в hero
   ===================================================== */
function initFloatingStats() {
  const hero = document.querySelector('.hero-inner');
  if (!hero || window.matchMedia('(max-width: 768px)').matches) return;

  const stats = [
    { label: 'Клиентов', value: 200, suffix: '+' },
    { label: 'Лет практики', value: 10, suffix: '+' },
    { label: 'Дел выиграно', value: 95, suffix: '%' },
  ];

  const wrap = document.createElement('div');
  wrap.style.cssText = `
    display: flex; gap: 20px; margin-top: 32px; flex-wrap: wrap;
  `;

  stats.forEach(s => {
    const card = document.createElement('div');
    card.style.cssText = `
      background: rgba(255,255,255,0.08);
      border: 1px solid rgba(255,255,255,0.15);
      border-radius: 12px;
      padding: 14px 20px;
      min-width: 100px;
      text-align: center;
    `;
    card.innerHTML = `
      <div class="stat-num" style="font-family:'Montserrat',sans-serif; font-weight:900; font-size:28px; color:#d4922a; line-height:1;">0${s.suffix}</div>
      <div style="font-size:12px; color:#8aa8c8; margin-top:4px; letter-spacing:0.5px;">${s.label}</div>
    `;
    wrap.appendChild(card);

    const numEl = card.querySelector('.stat-num');
    const obs = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(numEl, s.value, s.suffix, 1400);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    obs.observe(card);
  });

  const heroLeft = document.querySelector('.hero-left');
  if (heroLeft) heroLeft.appendChild(wrap);
}

/* =====================================================
   ACTIVE NAV — подсветка секции при скролле
   ===================================================== */
function initActiveSection() {
  const consultBtn = document.querySelector('.header-consultation');
  if (!consultBtn) return;

  const formSection = document.getElementById('form-section');
  if (!formSection) return;

  const obs = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      consultBtn.style.background = e.isIntersecting ? '#22c55e' : '';
    });
  }, { threshold: 0.3 });
  obs.observe(formSection);
}

/* =====================================================
   MOUSE TRAIL — золотые точки за курсором в hero
   ===================================================== */
function initMouseTrail() {
  const hero = document.querySelector('.hero');
  if (!hero || window.matchMedia('(max-width: 768px)').matches) return;

  hero.addEventListener('mousemove', (e) => {
    const dot = document.createElement('div');
    dot.style.cssText = `
      position: absolute;
      width: 5px; height: 5px;
      border-radius: 50%;
      background: rgba(212,146,42,0.6);
      pointer-events: none;
      left: ${e.clientX - hero.getBoundingClientRect().left}px;
      top:  ${e.clientY - hero.getBoundingClientRect().top}px;
      transform: translate(-50%,-50%);
      transition: opacity 0.8s ease, transform 0.8s ease;
      z-index: 0;
    `;
    hero.appendChild(dot);
    requestAnimationFrame(() => {
      dot.style.opacity = '0';
      dot.style.transform = 'translate(-50%,-50%) scale(3)';
    });
    setTimeout(() => dot.remove(), 900);
  });
}

/* =====================================================
   SMOOTH SCROLL
   ===================================================== */
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', function (e) {
      const href = this.getAttribute('href');
      if (href === '#') return;
      const target = document.querySelector(href);
      if (target) { e.preventDefault(); target.scrollIntoView({ behavior: 'smooth' }); }
    });
  });
}

/* =====================================================
   INIT
   ===================================================== */
document.addEventListener('DOMContentLoaded', function () {
  let savedLang = 'ru';
  try { savedLang = localStorage.getItem('site-lang') || 'ru'; } catch (e) {}
  setLang(savedLang);

  initLangSwitcher();
  initPhoneInput();
  initSmoothScroll();

  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.removeAttribute('onclick');
    btn.addEventListener('click', function () { toggleFaq(this); });
  });

  const initAnims = () => {
    initProgressBar();
    initScrollReveal();
    initCounters();
    initTyping();
    initBackToTop();
    initParallax();
    initFloatingStats();
    initActiveSection();
    initMouseTrail();
  };

  if ('requestIdleCallback' in window) {
    requestIdleCallback(initAnims, { timeout: 500 });
  } else {
    setTimeout(initAnims, 100);
  }
});