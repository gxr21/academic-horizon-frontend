import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authAPI } from '../../lib/api';

const academicBlue = '#1A5276';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await authAPI.forgotPassword({ email });
      setMessage(res.message || 'إذا كان البريد مسجلاً ستصلك رسالة لإعادة التعيين.');
    } catch (err) {
      setError(err.message || 'تعذر إرسال الطلب');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 font-tajawal" dir="rtl">
      <div className="w-full max-w-md bg-white rounded-[2rem] shadow-xl border border-gray-100 overflow-hidden">
        <div className="p-8 text-white" style={{ backgroundColor: academicBlue }}>
          <h1 className="text-2xl font-black">نسيت كلمة المرور</h1>
          <p className="text-blue-100/80 text-sm mt-2">أدخل بريدك وسنرسل رابط إعادة التعيين إن كان الحساب موجوداً.</p>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {message && <p className="rounded-2xl bg-green-50 text-green-700 border border-green-100 px-4 py-3 text-sm font-bold">{message}</p>}
          {error && <p className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">{error}</p>}
          <label className="block space-y-2">
            <span className="text-sm font-bold text-academic-blue">البريد الإلكتروني</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
              placeholder="name@email.com"
            />
          </label>
          <button
            type="submit"
            disabled={busy}
            className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ backgroundColor: academicBlue }}
          >
            {busy ? 'جاري الإرسال...' : 'إرسال رابط إعادة التعيين'}
          </button>
          <Link to="/login" className="block text-center text-sm font-bold text-academic-blue">العودة لتسجيل الدخول</Link>
        </form>
      </div>
    </div>
  );
}
