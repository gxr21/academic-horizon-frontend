// The OAuth client ID is public by design (it is visible in every page that uses it).
export const GOOGLE_CLIENT_ID =
  import.meta.env.VITE_GOOGLE_CLIENT_ID ||
  '697062121172-jqe2b509919dm6jmcgg5m625jdcmjp6g.apps.googleusercontent.com';

const SCRIPT_SRC = 'https://accounts.google.com/gsi/client';

let scriptPromise = null;

/** Loads Google's sign-in script once and resolves with window.google. */
export const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = () => {
      scriptPromise = null; // allow a retry on the next mount
      script.remove();
      reject(new Error('GOOGLE_SCRIPT_FAILED'));
    };
    document.head.appendChild(script);
  });

  return scriptPromise;
};
