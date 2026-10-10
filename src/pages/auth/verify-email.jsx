import { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../../context/AuthContext';

const academicBlue = '#1A5276';
const REDIRECT_SECONDS = 4;

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

const homeFor = (user) => {
  if (user?.role === 'provider') return '/dashboard';
  if (user?.role === 'admin') return '/admin';
  return '/home';
};

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const token = useMemo(() => (params.get('token') || '').trim(), [params]);

  // checking | done | invalid
  const [stage, setStage] = useState(token ? 'checking' : 'invalid');
  const [reason, setReason] = useState(token ? '' : 'رابط التفعيل ناقص. اطلب رابطاً جديداً من صفحة تسجيل الدخول.');
  const [account, setAccount] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);
  const started = useRef(false);

  // The link works once, so make sure React strict mode does not use it twice
  useEffect(() => {
    if (!token || started.current) return;
    started.current = true;
    verifyEmail(token).then((result) => {
      if (result.success) {
        setAccount(result.user);
        setStage('done');
      } else {
        setReason(result.error);
        setStage('invalid');
      }
    });
  }, [token, verifyEmail]);

  useEffect(() => {
    if (stage !== 'done') return undefined;
    if (secondsLeft <= 0) {
      navigate(homeFor(account), { replace: true });
      return undefined;
    }
    const timer = setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearTimeout(timer);
  }, [stage, secondsLeft, navigate, account]);

  if (stage === 'checking') {
    return (
      <Shell title="تأكيد البريد الإلكتروني" subtitle="لحظات، نفعّل حسابك...">
        <div className="space-y-3 animate-pulse" aria-busy="true">
          <div className="h-4 w-2/3 bg-gray-100 rounded" />
          <div className="h-12 bg-gray-100 rounded-xl" />
        </div>
      </Shell>
    );
  }

  if (stage === 'done') {
    return (
      <Shell title="تم تفعيل حسابك" subtitle="بريدك الإلكتروني مؤكد الآن.">
        <div className="text-center space-y-5">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-50 text-green-500 flex items-center justify-center text-3xl">
            <FaCheckCircle />
          </div>
          <div className="space-y-1">
            <p className="font-bold text-academic-blue">أهلاً بك في الأفق الأكاديمي</p>
            <p className="text-gray-600">سجّلنا دخولك تلقائياً.</p>
          </div>
          <Link
            to={homeFor(account)}
            replace
            className="block w-full py-3 rounded-xl text-white font-bold"
            style={{ backgroundColor: academicBlue }}
          >
            متابعة إلى المنصة
          </Link>
          <p className="text-xs text-gray-400" aria-live="polite">
            سيتم تحويلك تلقائياً خلال {secondsLeft} ثوانٍ
          </p>
        </div>
      </Shell>
    );
  }

  return (
    <Shell title="تعذر تفعيل الحساب" subtitle="لا يمكن تأكيد البريد بهذا الرابط.">
      <div className="text-center space-y-5">
        <div className="mx-auto w-16 h-16 rounded-full bg-red-50 text-red-500 flex items-center justify-center text-2xl">
          <FaExclamationTriangle />
        </div>
        <p className="text-gray-600 leading-relaxed">{reason}</p>
        <Link
          to="/login"
          className="block w-full py-3 rounded-xl text-white font-bold"
          style={{ backgroundColor: academicBlue }}
        >
          الذهاب لتسجيل الدخول
        </Link>
        <p className="text-xs text-gray-400">
          إذا لم يُفعَّل حسابك، حاول الدخول وسيظهر لك زر «إعادة إرسال» رابط التفعيل.
        </p>
      </div>
    </Shell>
  );
}
