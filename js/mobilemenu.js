document.addEventListener('DOMContentLoaded', () => {

  /* === 햄버거 & 모바일 메뉴 === */
  const burger   = document.getElementById('hamburgerBtn');
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
  /* 메뉴 항목 클릭 시 닫기 + 바텀바 active 갱신 */
  mobileNav.querySelectorAll('a').forEach(link=>{
    link.addEventListener('click', e=>{
      e.preventDefault();
      const targetHash = link.getAttribute('href');
      const targetId = decodeURIComponent(targetHash.slice(1));
      const targetSection = document.getElementById(targetId);

      toggleMenu(false);                    // 닫기
      targetSection?.scrollIntoView({behavior:'smooth'});
      setActiveBottom(targetHash);          // 바텀바 active 표시
    });
  });

  /* === 바텀바 active 표시 === */
  const bottomLinks = document.querySelectorAll('.nav-bottom a');
  const setActiveBottom = (targetHash) => {
    bottomLinks.forEach(a=>{
      a.classList.toggle('active', a.getAttribute('href')===targetHash);
    });
  };
  bottomLinks.forEach(a=>{
    a.addEventListener('click', e=>{
      setActiveBottom(a.getAttribute('href'));
    });
  });

  /* 최초 페이지 로드 시 초기 active */
  setActiveBottom(window.location.hash || '#about');
});
