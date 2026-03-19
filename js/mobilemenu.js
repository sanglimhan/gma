document.addEventListener('DOMContentLoaded', () => {
  /* === 햄버거 & 모바일 메뉴 === */
  const burger = document.getElementById('hamburgerBtn');
  const mobileNav = document.getElementById('mobileMenu');
  const closeBtn = document.getElementById('mobileMenuClose');

  const toggleMenu = (forceOpen) => {
    const isOpen = typeof forceOpen === 'boolean'
      ? forceOpen
      : !burger.classList.contains('open');

    burger.classList.toggle('open', isOpen);
    mobileNav.style.display = isOpen ? 'flex' : 'none';
    burger.setAttribute('aria-expanded', isOpen);
  };

  burger.addEventListener('click', () => toggleMenu());
  closeBtn?.addEventListener('click', () => toggleMenu(false));

  const allNavLinks = document.querySelectorAll('.mobile-nav a, .nav-bottom a');
  const validHashes = new Set(Array.from(allNavLinks, (link) => link.getAttribute('href')));

  const normalizeHash = (rawHash) => {
    if (!rawHash) return '';
    if (rawHash.startsWith('#')) {
      return `#${decodeURIComponent(rawHash.slice(1))}`;
    }
    return `#${decodeURIComponent(rawHash)}`;
  };

  const setActiveBottom = (targetHash) => {
    document.querySelectorAll('.nav-bottom a').forEach((link) => {
      link.classList.toggle('active', link.getAttribute('href') === targetHash);
    });
  };

  const syncSectionVisibility = (targetHash) => {
    const targetId = decodeURIComponent(targetHash.slice(1));
    document.querySelectorAll('.fade-in-section').forEach((section) => {
      section.classList.toggle('visible', section.id === targetId);
    });
  };

  const applyHashRoute = (rawHash, options = {}) => {
    const { scrollBehavior = 'auto' } = options;
    const normalizedHash = normalizeHash(rawHash);
    const targetHash = validHashes.has(normalizedHash) ? normalizedHash : '#intro';

    setActiveBottom(targetHash);
    syncSectionVisibility(targetHash);

    const targetId = decodeURIComponent(targetHash.slice(1));
    const targetSection = document.getElementById(targetId);

    if (targetSection && normalizedHash) {
      targetSection.scrollIntoView({ behavior: scrollBehavior, block: 'start' });
    }
  };

  /* 메뉴 항목 클릭 시 닫기 + 해시 라우팅 */
  mobileNav.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetHash = link.getAttribute('href');

      toggleMenu(false);

      if (window.location.hash === targetHash) {
        applyHashRoute(targetHash, { scrollBehavior: 'smooth' });
        return;
      }

      window.location.hash = targetHash;
    });
  });

  /* 해시 변경 시 섹션/active 동기화 */
  window.addEventListener('hashchange', () => {
    applyHashRoute(window.location.hash, { scrollBehavior: 'auto' });
  });

  /* 동적 섹션 로드 이후 현재 해시에 맞춰 재동기화 */
  window.addEventListener('site:sections-mounted', () => {
    applyHashRoute(window.location.hash, { scrollBehavior: 'auto' });
  });

  /* 최초 페이지 로드 시 초기 라우팅 */
  applyHashRoute(window.location.hash, { scrollBehavior: 'auto' });
});
