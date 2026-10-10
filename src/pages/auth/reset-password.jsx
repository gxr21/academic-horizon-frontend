import { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheck, FaCheckCircle, FaExclamationTriangle, FaEye, FaEyeSlash } from 'react-icons/fa';
import { authAPI } from '../../lib/api';

const academicBlue = '#1A5276';
const MIN_LENGTH = 6;
const REDIRECT_SECONDS = 6;

const STRENGTH = [
  { label: 'ضعيفة', bar: 'bg-red-400', text: 'text-red-600' },
  { label: 'مقبولة', bar: 'bg-orange-400', text: 'text-orange-600' },
  { label: 'جيدة', bar: 'bg-yellow-400', text: 'text-yellow-700' },
  { label: 'قوية', bar: 'bg-green-500', text: 'text-green-600' },
];

// 0..3 — only a hint for the visitor, the server enforces the minimum length
const scorePassword = (value) => {
  if (!value) return -1;
  let score = 0;
  if (value.length >= 8) score += 1;
  if (/[A-Za-z]/.test(value) && /\d/.test(value)) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (value.length >= 12 || /[^A-Za-z0-9]/.test(value)) score += 1;
  return Math.min(score, 3);
};

function Shell({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10 font-tajawal" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-white" style={{ backgroundColor: academicBlue }}>
          <h1 className="text-2xl font-black">{title}</h1>
          {subtitle && <p className="text-blue-100/80 text-sm mt-2">{subtitle}</p>}
        </div>
        <div className="p-8">{children}</div>
      </div>
    </div>
  );
}

Shell.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};

function PasswordField({ label, value, onChange, autoComplete, invalid }) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="block space-y-2">
      <span className="text-sm font-bold text-academic-blue">{label}</span>
      <div className="relative">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          dir="ltr"
          className={`w-full pl-4 pr-12 py-3 bg-gray-50 border rounded-xl outline-none text-left focus:border-academic-blue ${
            invalid ? 'border-red-300' : 'border-gray-200'
          }`}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'إخفاء كلمة المرور' : 'إظهار كلمة المرور'}
          className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-gray-400 hover:text-academic-blue"
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      </div>
    </label>
  );
}

PasswordField.propTypes = {
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  autoComplete: PropTypes.string,
  invalid: PropTypes.bool,
};

function Rule({ ok, children }) {
  return (
    <li className={`flex items-center gap-2 text-sm ${ok ? 'text-green-600' : 'text-gray-400'}`}>
      <span
        className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] ${
          ok ? 'bg-green-500 text-white' : 'bg-gray-200 text-transparent'
        }`}
      >
        <FaCheck />
      </span>
      {children}
    </li>
  );
}

Rule.propTypes = {
  ok: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
};

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);

  // checking | invalid | form | done
  const [stage, setStage] = useState(token ? 'checking' : 'invalid');
  const [invalidReason, setInvalidReason] = useState(
    token ? '' : 'رابط إعادة التعيين ناقص. اطلب رابطاً جديداً.'
  );
  const [maskedEmail, setMaskedEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  // Check the link as soon as the page opens
  useEffect(() => {
    if (!token) return undefined;
    let cancelled = false;
    authAPI
      .verifyResetToken(token)
      .then((res) => {
        if (cancelled) return;
        setMaskedEmail(res.data?.email || '');
        setStage('form');
      })
      .catch((err) => {
        if (cancelled) return;
        // Older backend without the check endpoint: let the visitor try the form
        if (err.status === 404 || err.code === 'NETWORK_ERROR') {
          setStage('form');
          return;
        }
        setInvalidReason(err.message || 'رابط إعادة التعيين غير صالح أو منتهٍ.');
        setStage('invalid');
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  // After success, count down and send the visitor to the login page
  useEffect(() => {
    if (stage !== 'done') return undefined;
    if (secondsLeft <= 0) {
      navigate('/login', { replace: true });
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, secondsLeft, navigate]);

  const score = scorePassword(password);
  const longEnough = password.length >= MIN_LENGTH;
  const matches = confirm.length > 0 && password === confirm;
  const canSubmit = longEnough && matches && !busy;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!longEnough) {
      setError(`كلمة المرور يجب أن تكون ${MIN_LENGTH} أحرف على الأقل.`);
      return;
    }
    if (!matches) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    setBusy(true);
    try {
      await authAPI.resetPassword({ token, password });
      setStage('done');
    } catch (err) {
      if (err.status === 400 && /غير صالح|منتهٍ/.test(err.message || '')) {
        setInvalidReason(err.message);
        setStage('invalid');
      } else {
        setError(err.message || 'تعذر تعيين كلمة المرور. حاول مرة أخرى.');
      }
    } finally {
      setBusy(false);
    }
  };

  if (stage === 'checking') {
    return (
      <Shell title="إعادة تعيين كلمة المرور" subtitle="نتحقق من الرابط...">
        <div className="space-y-3 animate-pulse" aria-busy="true">
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded-xl" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (stage === 'invalid') {
    return (
      <Shell title="الرابط غير صالح" subtitle="لا يمكن تعيين كلمة المرور بهذا الرابط.">
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl">
            <FaExclamationTriangle />
          </div>
          <p className="text-gray-600 leading-relaxed">{invalidReason}</p>
          <p className="text-sm text-gray-400">الرابط يعمل لمرة واحدة ولمدة ساعة من وقت الإرسال.</p>
          <Link
            to="/forgot-password"
            className="block w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: academicBlue }}
          >
            طلب رابط جديد
          </Link>
          <Link to="/login" className="block text-sm font-bold text-academic-blue">
            العودة لتسجيل الدخول
          </Link>
        </div>
      </Shell>
    );
  }

  if (stage === 'done') {
    return (
      <Shell title="تم تغيير كلمة المرور" subtitle="حسابك الآن محمي بكلمة المرور الجديدة.">
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-3xl">
            <FaCheckCircle />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-academic-blue">تمت العملية بنجاح</p>
            <p className="text-gray-600">يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة.</p>
          </div>
          <Link
            to="/login"
            replace
            className="block w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: academicBlue }}
          >
            تسجيل الدخول الآن
          </Link>
          <p className="text-xs text-gray-400" aria-live="polite">
            سيتم تحويلك تلقائياً خلال {secondsLeft} ثوانٍ
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="تعيين كلمة مرور جديدة" subtitle="اختر كلمة مرور لا تستخدمها في مكان آخر.">
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {maskedEmail && (
          <div className="rounded-2xl bg-gray-50 border border-gray-100 px-4 py-3 text-sm text-gray-600">
            الحساب: <span className="font-bold text-academic-blue" dir="ltr">{maskedEmail}</span>
          </div>
        )}

        {error && (
          <p role="alert" className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">
            {error}
          </p>
        )}

        <PasswordField
          label="كلمة المرور الجديدة"
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
        />

        {password && (
          <div className="space-y-2" aria-live="polite">
            <div className="flex gap-1.5">
              {STRENGTH.map((item, i) => (
                <span
                  key={item.label}
                  className={`h-1.5 flex-1 rounded-full ${i <= score ? STRENGTH[score].bar : 'bg-gray-200'}`}
                />
              ))}
            </div>
            <p className={`text-xs font-bold ${STRENGTH[score].text}`}>قوة كلمة المرور: {STRENGTH[score].label}</p>
          </div>
        )}

        <PasswordField
          label="تأكيد كلمة المرور"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          invalid={confirm.length > 0 && !matches}
        />

        <ul className="space-y-1.5">
          <Rule ok={longEnough}>{MIN_LENGTH} أحرف على الأقل</Rule>
          <Rule ok={matches}>كلمتا المرور متطابقتان</Rule>
        </ul>

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: academicBlue }}
        >
          {busy ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
        </button>
        <Link to="/login" className="block text-center text-sm font-bold text-academic-blue">
          العودة لتسجيل الدخول
        </Link>
      </form>
    </Shell>
  );
}
