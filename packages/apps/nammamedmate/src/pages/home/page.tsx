import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { LandingPage } from '@/components/sections/LandingPage';

export function HomePage() {
  const { hash } = useLocation();

  useEffect(() => {
    if (!hash) return;
    const id = hash.replace(/^#/, '');
    const el = document.getElementById(id);
    if (!el) return;
    const frame = requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [hash]);

  return <LandingPage />;
}

export default HomePage;
