import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { authAPI } from '../../lib/api';

const COOLDOWN_SECONDS = 60;

/**
 * "Send me the link again" button with a cooldown (the server throttles too).
 */
function ResendVerification({ email, startCooldown = false, className = '' }) {
  const [seconds, setSeconds] = useState(startCooldown ? COOLDOWN_SECONDS : 0);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (seconds <= 0) return undefined;
    const timer = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [seconds]);

  const handleResend = async () => {
    setBusy(true);
    setMessage('');
    setFailed(false);
    try {
      await authAPI.resendVerification({ email });
      setMessage('أرسلنا رابطاً جديداً. تفقد بريدك (وصندوق الرسائل غير المرغوبة).');
      setSeconds(COOLDOWN_SECONDS);
    } catch (err) {
      setFailed(true);
      setMessage(err.message || 'تعذر إرسال الرابط. حاول بعد قليل.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={`text-center space-y-2 ${className}`} dir="rtl">
      <button
        type="button"
        onClick={handleResend}
        disabled={busy || seconds > 0}
        className="text-sm font-bold text-academic-blue disabled:text-gray-400 disabled:cursor-not-allowed hover:underline"
      >
        {busy ? 'جاري الإرسال...' : seconds > 0 ? `إعادة الإرسال بعد ${seconds} ثانية` : 'لم يصلك البريد؟ أعد الإرسال'}
      </button>
      {message && (
        <p role="status" className={`text-xs ${failed ? 'text-red-600' : 'text-green-700'}`}>
          {message}
        </p>
      )}
    </div>
  );
}

ResendVerification.propTypes = {
  email: PropTypes.string.isRequired,
  startCooldown: PropTypes.bool,
  className: PropTypes.string,
};

export default ResendVerification;
