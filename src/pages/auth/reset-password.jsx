import { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { authAPI } from '../../lib/api';

const academicBlue = '#1A5276';

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = useMemo(() => params.get('token') || '', [params]);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!token) {
      setError('رابط إعادة التعيين ناقص. اطلب رابطاً جديداً.');
      return;
    }
    if (password.length < 6) {
      setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    if (password !== confirm) {
      setError('تأكيد كلمة المرور غير مطابق.');
      return;
    }
    setBusy(true);
    try {
      await authAPI.resetPassword({ token, password });
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err.message || 'تعذر تعيين كلمة المرور');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-tajawal" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-white" style={{ backgroundColor: academicBlue }}>
          <h1 className="text-2xl font-black">تعيين كلمة مرور جديدة</h1>
          <p className="text-blue-100/80 text-sm mt-2">الرابط صالح لمدة ساعة واحدة من وقت الإرسال.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {error && <p className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">{error}</p>}
          <label className="block space-y-2">
            <span className="text-sm font-bold text-academic-blue">كلمة المرور الجديدة</span>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm font-bold text-academic-blue">تأكيد كلمة المرور</span>
            <input
              type="password"
              required
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={busy || !token}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ backgroundColor: academicBlue }}
          >
            {busy ? 'جاري الحفظ...' : 'حفظ كلمة المرور'}
          </button>
          <Link to="/forgot-password" className="block text-center text-sm font-bold text-academic-blue">طلب رابط جديد</Link>
        </form>
      </div>
    </div>
  );
}
