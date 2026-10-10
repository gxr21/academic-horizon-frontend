import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getStoredUserRaw } from '../../lib/authStorage';
import './splash.css';

const SEEN_KEY = 'ah_splash_seen';
const MIN_VISIBLE_MS = 3200; // long enough for the whole sequence to play
const MAX_VISIBLE_MS = 7000; // never trap the visitor if the API is slow
const LEAVE_MS = 1300;
const TICKS = 61;

const shouldPlay = () => {
  try {
    const forced = new URLSearchParams(window.location.search).has('splash');
    return forced || !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return false;
  }
};

const readFirstName = () => {
  try {
    const raw = getStoredUserRaw();
    const name = raw ? JSON.parse(raw)?.name : '';
    return typeof name === 'string' ? name.trim().split(/\s+/)[0] : '';
  } catch {
    return '';
  }
};

/**
 * Welcome screen shown once per browser session, before the site.
 * It sits on top of the app, so the pages finish loading underneath it.
 */
export default function Splash() {
  const { isLoading } = useAuth();
  const [phase, setPhase] = useState(() => (shouldPlay() ? 'show' : 'gone'));
  const [firstName] = useState(readFirstName);
  const [minElapsed, setMinElapsed] = useState(false);
  const [forced, setForced] = useState(false);
  const [fontsReady, setFontsReady] = useState(false);

  // The static placeholder from index.html has done its job
  useEffect(() => {
    document.getElementById('boot')?.remove();
  }, []);

  // Keep the page still while the welcome plays
  useEffect(() => {
    if (phase === 'gone') return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [phase]);

  useEffect(() => {
    if (phase !== 'show') return undefined;
    const minTimer = setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS);
    const maxTimer = setTimeout(() => setForced(true), MAX_VISIBLE_MS);
    (document.fonts?.ready ?? Promise.resolve()).then(() => setFontsReady(true));
    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
    };
  }, [phase]);

  const ready = forced || (minElapsed && fontsReady && !isLoading);

  useEffect(() => {
    if (phase === 'show' && ready) setPhase('leaving');
  }, [phase, ready]);

  useEffect(() => {
    if (phase !== 'leaving') return undefined;
    try {
      sessionStorage.setItem(SEEN_KEY, '1');
    } catch {
      /* private mode: the welcome simply plays again next time */
    }
    const timer = setTimeout(() => setPhase('gone'), LEAVE_MS);
    return () => clearTimeout(timer);
  }, [phase]);

  if (phase === 'gone') return null;

  return (
    <div
      className={`ah-splash${phase === 'leaving' ? ' is-leaving' : ''}`}
      dir="rtl"
      role="status"
      aria-live="polite"
      aria-label="جاري تحميل الأفق الأكاديمي"
    >
      <div className="ah-splash__stage">
        <div className="ah-splash__sky" aria-hidden="true">
          <span className="ah-splash__ring" />
          <span className="ah-splash__sun" />
        </div>

        <div className="ah-splash__horizon" aria-hidden="true" />

        <div className="ah-splash__scale" aria-hidden="true">
          {Array.from({ length: TICKS }, (_, i) => (
            <span
              key={i}
              className={`ah-splash__tick${i % 6 === 0 ? ' ah-splash__tick--major' : ''}`}
              style={{ '--i': i }}
            />
          ))}
        </div>

        <p className="ah-splash__greeting">
          {firstName ? `أهلاً بعودتك يا ${firstName}` : 'أهلاً بك في'}
        </p>
        <h1 className="ah-splash__name">الأفق الأكاديمي</h1>
        <p className="ah-splash__tagline">حيث تبدأ رحلتك العلمية</p>
      </div>
    </div>
  );
}
