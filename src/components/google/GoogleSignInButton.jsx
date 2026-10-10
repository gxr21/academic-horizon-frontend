import { useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { GOOGLE_CLIENT_ID, loadGoogleScript } from '../../lib/google';

/**
 * Official "Sign in with Google" button.
 * Google renders the button itself and hands back a signed ID token (credential).
 */
export default function GoogleSignInButton({ onCredential, text = 'continue_with', width = 320 }) {
  const holder = useRef(null);
  const handler = useRef(onCredential);
  const [failed, setFailed] = useState(false);

  // Always call the latest callback without re-rendering Google's button
  useEffect(() => {
    handler.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleScript()
      .then((google) => {
        if (cancelled || !holder.current) return;
        google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (response?.credential) handler.current?.(response.credential);
          },
          cancel_on_tap_outside: true,
        });
        holder.current.innerHTML = '';
        google.accounts.id.renderButton(holder.current, {
          type: 'standard',
          theme: 'outline',
          size: 'large',
          shape: 'rectangular',
          text,
          logo_alignment: 'left',
          locale: 'ar',
          width: Math.min(Math.max(width, 200), 400),
        });
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [text, width]);

  if (failed) {
    return (
      <p className="text-center text-sm text-gray-400" dir="rtl">
        تعذر تحميل زر Google. تأكد من الاتصال بالإنترنت وأن المتصفح لا يحجب accounts.google.com.
      </p>
    );
  }

  return <div ref={holder} className="flex justify-center min-h-[44px]" dir="ltr" />;
}

GoogleSignInButton.propTypes = {
  onCredential: PropTypes.func.isRequired,
  text: PropTypes.oneOf(['signin_with', 'signup_with', 'continue_with', 'signin']),
  width: PropTypes.number,
};
