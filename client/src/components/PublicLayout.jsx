import { Outlet, useLocation } from 'react-router-dom';
import { useCallback, useEffect, useRef, useState } from 'react';
import Header from './Header';
import Footer from './Footer';

function BrandIntro({ onFinish }) {
  const overlayRef = useRef(null);
  const brandRef = useRef(null);

  useEffect(() => {
    const finish = () => {
      sessionStorage.setItem('sreebhadraIntroSeen', 'true');
      onFinish();
    };

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      const timer = setTimeout(finish, 250);
      return () => clearTimeout(timer);
    }

    const timer = setTimeout(() => {
      const brand = brandRef.current;
      const overlay = overlayRef.current;
      const target = document.querySelector('[data-site-logo]');

      if (!brand || !overlay || !target) {
        finish();
        return;
      }

      const start = brand.getBoundingClientRect();
      const end = target.getBoundingClientRect();
      const scale = end.width / start.width;

      brand.style.left = `${start.left}px`;
      brand.style.top = `${start.top}px`;
      brand.style.transform = 'none';

      const move = brand.animate(
        [
          { transform: 'translate(0, 0) scale(1)' },
          {
            transform: `translate(${end.left - start.left}px, ${
              end.top - start.top
            }px) scale(${scale})`,
          },
        ],
        {
          duration: 1100,
          easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
          fill: 'forwards',
        },
      );

      move.onfinish = () => {
        const fade = overlay.animate(
          [{ opacity: 1 }, { opacity: 0 }],
          { duration: 250, fill: 'forwards' },
        );
        fade.onfinish = finish;
      };
    }, 1050);

    return () => clearTimeout(timer);
  }, [onFinish]);

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-forest"
      aria-label="Welcome to Sree Bhadra"
    ><div
  ref={brandRef}
  className="absolute left-1/2 top-1/2 inline-flex -translate-x-1/2 -translate-y-1/2 items-center gap-3 whitespace-nowrap font-display text-4xl font-extrabold tracking-tight text-ivory sm:text-5xl"
>
  <img
    src="/sreebhadra_logo.png"
    alt=""
    className="h-20 w-auto object-contain"
    style={{ animation: 'intro-logo-appear 550ms ease-out both' }}
  />
  <span style={{ animation: 'intro-name-appear 500ms 450ms ease-out both' }}>
    Sree Bhadra
  </span>
</div>
    </div>
  );
}

export default function PublicLayout() {
  const { pathname } = useLocation();

  const [showIntro, setShowIntro] = useState(
    () =>
      pathname === '/' &&
      sessionStorage.getItem('sreebhadraIntroSeen') !== 'true',
  );

  const finishIntro = useCallback(() => setShowIntro(false), []);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <Header brandHidden={showIntro} />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {showIntro && <BrandIntro onFinish={finishIntro} />}
    </div>
  );
}