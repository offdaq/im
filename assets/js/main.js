// 1. Кэш оригинальных текстов
function cacheOriginalTexts() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    if (el.dataset.i18nOriginal) return;
    if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
      el.dataset.i18nOriginal = el.placeholder;
    } else if (el.tagName === 'TITLE') {
      el.dataset.i18nOriginal = document.title;
    } else {
      el.dataset.i18nOriginal = el.textContent.trim();
    }
  });
}

// 2. Функция перерисовки страницы
function updateContent() {
  const lang = i18next.language;

  document.querySelectorAll('[data-i18n]').forEach(el => {
    const key = el.getAttribute('data-i18n');
    const original = el.dataset.i18nOriginal;

    if (!['ru', 'no'].includes(lang)) {
      // язык «английский» или любой другой — оригинальный текст
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = original;
      } else if (el.tagName === 'TITLE') {
        document.title = original;
      } else {
        el.textContent = original;
      }
    } else {
      // для ru/no — перевод из JSON
      const translation = i18next.t(key);
      if (!translation) return;
      if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
        el.placeholder = translation;
      } else if (el.tagName === 'TITLE') {
        document.title = translation;
      } else {
        el.textContent = translation;
      }
    }
  });

  // корректный атрибут lang в <html>
  document.documentElement.lang = ['ru', 'no'].includes(lang) ? lang : 'en';

  const uiLang = lang === 'ru' || lang === 'no' ? lang : 'en';
  document.querySelectorAll('#lang-switcher a[data-lang]').forEach(link => {
    link.classList.toggle('active', link.dataset.lang === uiLang);
  });
}

function initHeroBackground() {
  const wrap = document.querySelector('.hero-bg-wrap');
  const video = wrap?.querySelector('video');
  if (!wrap || !video) return;

  const useGifFallback = () => {
    if (!wrap.contains(video)) return;
    video.remove();
    if (wrap.querySelector('.hero-bg-fallback')) return;
    const img = document.createElement('img');
    img.className = 'hero-bg-fallback';
    img.src = 'assets/img/bg_site.gif';
    img.alt = '';
    wrap.appendChild(img);
  };

  video.addEventListener('error', useGifFallback, { once: true });

  const resumeOnGesture = () => {
    const resume = () => {
      video.play().catch(() => {});
    };
    window.addEventListener('touchstart', resume, { passive: true, capture: true, once: true });
    window.addEventListener('click', resume, { capture: true, once: true });
  };

  video.play().catch(resumeOnGesture);
}

/**
 * Язык по настройке «Языки» браузера (полный список и порядок важны).
 * Раньше брали только navigator.languages[0] — у многих первым идёт en,
 * даже если вторым указан русский («интерфейс на русском» не меняет первый слот автоматически).
 * nb/nn нормализуем к no под ваш no.json.
 */
function detectPreferredLocaleFromBrowser() {
  const normalizeBase = locale =>
    String(locale || '')
      .replace('_', '-')
      .split('-')[0]
      .toLowerCase();

  const resolve = base => {
    if (base === 'ru') return 'ru';
    if (base === 'no' || base === 'nb' || base === 'nn') return 'no';
    return null;
  };

  const list =
    navigator.languages && navigator.languages.length
      ? Array.from(navigator.languages)
      : [navigator.language].filter(Boolean);

  for (const raw of list) {
    const code = resolve(normalizeBase(raw));
    if (code) return code;
  }
  return null;
}

document.addEventListener('DOMContentLoaded', () => {
  cacheOriginalTexts();
  initHeroBackground();

  const stored = localStorage.getItem('language');
  const initialLang =
    stored === 'ru' || stored === 'no'
      ? stored
      : detectPreferredLocaleFromBrowser() || 'en';

  // 4. Инициализируем i18next (только для ru/no)
  i18next
    .use(i18nextHttpBackend)
    .init({
      lng: initialLang,
      fallbackLng: false,
      supportedLngs: ['ru', 'no'],
      backend: { loadPath: 'assets/translations/{{lng}}.json' }
    }, err => {
      if (err) console.error(err);
      updateContent();
    });

  // 5. Переключатель языков
  const switcher = document.getElementById('lang-switcher');
  if (switcher) {
    switcher.addEventListener('click', async e => {
      const btn = e.target.closest('a[data-lang]');
      if (!btn) return;
      e.preventDefault();

      const newLang = btn.dataset.lang;

      if (['ru', 'no'].includes(newLang)) {
        // сохраняем выбор и меняем через i18next
        localStorage.setItem('language', newLang);
        await i18next.changeLanguage(newLang);
      } else {
        // выбрали «английский» — удаляем сохранение и сбрасываем
        localStorage.removeItem('language');
        i18next.language = 'en';
      }

      updateContent();
    });
  }
});

(function() {
  "use strict";

  /**
   * Header toggle
   */
  const headerToggleBtn = document.querySelector('.header-toggle');

  function headerToggle() {
    document.querySelector('#header').classList.toggle('header-show');
    headerToggleBtn.classList.toggle('bi-list');
    headerToggleBtn.classList.toggle('bi-x');
  }
  headerToggleBtn.addEventListener('click', headerToggle);

  /**
   * Hide mobile nav on same-page/hash links
   */
  document.querySelectorAll('#navmenu a, .social-links a').forEach(navmenu => {
    navmenu.addEventListener('click', () => {
      if (document.querySelector('.header-show')) {
        headerToggle();
      }
    });

  });

  /**
   * Toggle mobile nav dropdowns
   */
  document.querySelectorAll('.navmenu .toggle-dropdown').forEach(navmenu => {
    navmenu.addEventListener('click', function(e) {
      e.preventDefault();
      this.parentNode.classList.toggle('active');
      this.parentNode.nextElementSibling.classList.toggle('dropdown-active');
      e.stopImmediatePropagation();
    });
  });

  /**
 * Preloader
 */
  const preloader = document.querySelector('#preloader');
  if (preloader) {
    window.addEventListener('load', () => {
    preloader.style.opacity = '0';
    setTimeout(() => preloader.remove(), 600);
  });
  }

  /**
   * Scroll top button
   */
  let scrollTop = document.querySelector('.scroll-top');

  function toggleScrollTop() {
    if (scrollTop) {
      window.scrollY > 100 ? scrollTop.classList.add('active') : scrollTop.classList.remove('active');
    }
  }
  scrollTop.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  });

  window.addEventListener('load', toggleScrollTop);
  document.addEventListener('scroll', toggleScrollTop);

  /**
   * Animation on scroll function and init
   */
  function aosInit() {
    AOS.init({
      duration: 600,
      easing: 'ease-in-out',
      once: true,
      mirror: false
    });
  }
  window.addEventListener('load', aosInit);

  /**
   * Init typed.js
   */
  const selectTyped = document.querySelector('.typed');
  if (selectTyped) {
    let typed_strings = selectTyped.getAttribute('data-typed-items');
    typed_strings = typed_strings.split(',');
    new Typed('.typed', {
      strings: typed_strings,
      loop: true,
      typeSpeed: 100,
      backSpeed: 50,
      backDelay: 2000
    });
  }

  /**
   * Initiate Pure Counter
   */
  new PureCounter();

  /**
   * Animate the skills items on reveal
   */
  let skillsAnimation = document.querySelectorAll('.skills-animation');
  skillsAnimation.forEach((item) => {
    new Waypoint({
      element: item,
      offset: '80%',
      handler: function(direction) {
        let progress = item.querySelectorAll('.progress .progress-bar');
        progress.forEach(el => {
          el.style.width = el.getAttribute('aria-valuenow') + '%';
        });
      }
    });
  });

  /**
   * Initiate glightbox
   */
  const glightbox = GLightbox({
    selector: '.glightbox'
  });

  /**
   * Init isotope layout and filters
   */
  document.querySelectorAll('.isotope-layout').forEach(function(isotopeItem) {
    let layout = isotopeItem.getAttribute('data-layout') ?? 'masonry';
    let filter = isotopeItem.getAttribute('data-default-filter') ?? '*';
    let sort = isotopeItem.getAttribute('data-sort') ?? 'original-order';

    let initIsotope;
    imagesLoaded(isotopeItem.querySelector('.isotope-container'), function() {
      initIsotope = new Isotope(isotopeItem.querySelector('.isotope-container'), {
        itemSelector: '.isotope-item',
        layoutMode: layout,
        filter: filter,
        sortBy: sort
      });
    });

    isotopeItem.querySelectorAll('.isotope-filters li').forEach(function(filters) {
      filters.addEventListener('click', function() {
        isotopeItem.querySelector('.isotope-filters .filter-active').classList.remove('filter-active');
        this.classList.add('filter-active');
        initIsotope.arrange({
          filter: this.getAttribute('data-filter')
        });
        if (typeof aosInit === 'function') {
          aosInit();
        }
      }, false);
    });

  });

  /**
   * Init swiper sliders
   */
  function initSwiper() {
    document.querySelectorAll(".init-swiper").forEach(function(swiperElement) {
      let config = JSON.parse(
        swiperElement.querySelector(".swiper-config").innerHTML.trim()
      );

      if (swiperElement.classList.contains("swiper-tab")) {
        initSwiperWithCustomPagination(swiperElement, config);
      } else {
        new Swiper(swiperElement, config);
      }
    });
  }

  window.addEventListener("load", initSwiper);

  /**
   * Correct scrolling position upon page load for URLs containing hash links.
   */
  window.addEventListener('load', function(e) {
    if (window.location.hash) {
      if (document.querySelector(window.location.hash)) {
        setTimeout(() => {
          let section = document.querySelector(window.location.hash);
          let scrollMarginTop = getComputedStyle(section).scrollMarginTop;
          window.scrollTo({
            top: section.offsetTop - parseInt(scrollMarginTop),
            behavior: 'smooth'
          });
        }, 100);
      }
    }
  });

  /**
   * Navmenu Scrollspy
   */
  let navmenulinks = document.querySelectorAll('.navmenu a');

  function navmenuScrollspy() {
    navmenulinks.forEach(navmenulink => {
      if (!navmenulink.hash) return;
      let section = document.querySelector(navmenulink.hash);
      if (!section) return;
      let position = window.scrollY + 200;
      if (position >= section.offsetTop && position <= (section.offsetTop + section.offsetHeight)) {
        document.querySelectorAll('.navmenu a.active').forEach(link => link.classList.remove('active'));
        navmenulink.classList.add('active');
      } else {
        navmenulink.classList.remove('active');
      }
    })
  }
  window.addEventListener('load', navmenuScrollspy);
  document.addEventListener('scroll', navmenuScrollspy);

})();

async function loadStatsFromCSV() {
  try {
    // 1) Подтягиваем CSV (с «анти-кэш» параметром)
    const response = await fetch(`assets/import.csv?t=${Date.now()}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();

    // 2) Разбиваем на строки с учётом Windows (\r\n)
    const rows = text
      .split(/\r?\n/)
      .map(r => r.trim())
      .filter(r => r !== '');

    // 3) Функция для вытаскивания колонки №2
    const getCol2 = (row) => {
      const cols = row.split(',');
      return (cols[1] || '').replace(/"/g, '').trim();
    };

    // 4) Ищем нужные строки
    const assembledRow   = rows.find(r => r.startsWith('Sykler (monterte opp)'));
    const experienceRow  = rows.find(r => r.startsWith('Jobber (år)'));
    const repairedRow    = rows.find(r => r.startsWith('Sykler (reparerte)'));
    const updatedRow     = rows.find(r => r.startsWith('Oppdatert'));
    const worktimeRow    = rows.find(r => r.startsWith('Arbeidstid (time)'));

    const statMap = {
      'assembled': assembledRow  ? getCol2(assembledRow)  : '—',
      'experience': experienceRow ? getCol2(experienceRow) : '—',
      'repaired':   repairedRow    ? getCol2(repairedRow)   : '—',
      // Для времени обновления у вас в HTML <time id="stats-updated">
      'updated':    updatedRow     ? getCol2(updatedRow)     : '—',
      'worktime':    worktimeRow     ? getCol2(worktimeRow)     : '—'

    };

    // 5) Вставляем в блоки .stat-assembled, .stat-experience, .stat-repaired
    Object.entries(statMap).forEach(([key, value]) => {
      if (key === 'updated') {
        // для updated используем #stats-updated
        const tm = document.getElementById('stats-updated');
        if (tm) tm.textContent = value;
      } else {
        document.querySelectorAll(`.stat-${key}`).forEach(el => {
          el.textContent = value;
        });
      }
    });

  } catch (err) {
    console.error('Ошибка загрузки статистики из CSV:', err);
  }
}

document.addEventListener('DOMContentLoaded', loadStatsFromCSV);


document.addEventListener('DOMContentLoaded', () => {
  const desc = document.querySelector('.hero-description');
  if (!desc) return;

  if (window.innerWidth > 992) return;

  // Получаем текст и разбиваем на слова
  const text = desc.textContent.trim();
  const words = text.split(/\s+/);

  // Оборачиваем каждое слово в span и добавляем пробел между ними
  desc.innerHTML = words
    .map(w => `<span>${w}</span>`)
    .join(' ');
});