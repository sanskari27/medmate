import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BrandMarkIcon } from '@/components/icons/BrandMarkIcon';
import { LocationPinIcon } from '@/components/icons/LocationPinIcon';
import { MenuIcon } from '@/components/icons/MenuIcon';
import { brand, navLinks } from '@/content/landing/site';

type SiteHeaderProps = {
  fragmentPrefix: '' | '/';
  onBookDemo: () => void;
};

export function SiteHeader({ fragmentPrefix, onBookDemo }: SiteHeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className="nl-header">
      <div className="nl-wrap nl-nav">
        <Link className="nl-brand" to="/" aria-label={`${brand.name} home`}>
          <span className="nl-mark">
            <BrandMarkIcon />
          </span>
          <span>
            <span className="nl-wordmark">
              <span className="nm">Namma</span> MedMate
            </span>
            <span className="nl-brand-tag" style={{ display: 'block' }}>
              {brand.tagline}
            </span>
          </span>
        </Link>
        <nav className="nl-navlinks">
          {navLinks.map((link) =>
            link.href.startsWith('/#') ? (
              <a
                key={link.label}
                href={`${fragmentPrefix}${link.href.slice(1)}`}
              >
                {link.label}
              </a>
            ) : (
              <Link key={link.label} to={link.href}>
                {link.label}
              </Link>
            ),
          )}
        </nav>
        <div className="nl-nav-right">
          <span className="nl-loc">
            <LocationPinIcon /> Bengaluru
          </span>
          <button
            type="button"
            className="nl-btn nl-btn-primary"
            onClick={onBookDemo}
          >
            Book a free demo
          </button>
          <button
            type="button"
            className="nl-burger"
            aria-label="Menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <MenuIcon />
          </button>
        </div>
      </div>
      <div className={`nl-mobilemenu${menuOpen ? ' open' : ''}`}>
        {navLinks.map((link) =>
          link.href.startsWith('/#') ? (
            <a
              key={link.label}
              href={`${fragmentPrefix}${link.href.slice(1)}`}
              onClick={closeMenu}
            >
              {link.label}
            </a>
          ) : (
            <Link key={link.label} to={link.href} onClick={closeMenu}>
              {link.label}
            </Link>
          ),
        )}
        <button
          type="button"
          className="nl-btn nl-btn-primary"
          onClick={() => {
            closeMenu();
            onBookDemo();
          }}
        >
          Book a free demo
        </button>
      </div>
    </header>
  );
}
