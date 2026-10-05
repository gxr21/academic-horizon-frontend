import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FaUser, FaPhone, FaEnvelope, FaLock, FaArrowRight, FaGraduationCap } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI } from '../../lib/api';

const academicBlue = '#1A5276';
const academicGold = '#E9C176';

const GENDER_OPTIONS = [
  { value: 'male', label: 'ذكر' },
  { value: 'female', label: 'أنثى' },
  { value: 'unspecified', label: 'أفضل عدم الإجابة' },
];

export default function StudentSettings() {
  const navigate = useNavigate();
  const { user, updateUser, refreshUser } = useAuth();

  const [settings, setSettings] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    gender: user?.gender || 'unspecified',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setSettings((prev) => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      gender: user?.gender || 'unspecified',
    }));
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!settings.name.trim() || settings.name.trim().length < 3) {
      setError('الاسم يجب أن يكون 3 أحرف على الأقل');
      return;
    }
    if (!settings.email.trim()) {
      setError('البريد الإلكتروني مطلوب');
      return;
    }
    if (settings.newPassword) {
      if (!settings.currentPassword) {
        setError('أدخل كلمة المرور الحالية لتغييرها');
        return;
      }
      if (settings.newPassword.length < 6) {
        setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
        return;
      }
      if (settings.newPassword !== settings.confirmPassword) {
        setError('تأكيد كلمة المرور غير مطابق');
        return;
      }
    }

    setBusy(true);
    try {
      const payload = {
        name: settings.name.trim(),
        phone: settings.phone.trim(),
        email: settings.email.trim(),
        gender: settings.gender,
      };
      if (settings.newPassword) {
        payload.currentPassword = settings.currentPassword;
        payload.newPassword = settings.newPassword;
      }
      const res = await userAPI.updateProfile(payload);
      if (res.data?.user) updateUser(res.data.user);
      else await refreshUser();
      setSettings((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMessage('تم حفظ التغييرات بنجاح');
    } catch (err) {
      setError(err.message || 'تعذر حفظ التغييرات');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 font-tajawal" dir="rtl">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-2 mb-6 group transition-all"
          style={{ color: academicBlue }}
        >
          <FaArrowRight className="group-hover:translate-x-1 transition-transform" />
          <span className="font-bold">العودة للملف الشخصي</span>
        </button>

        <div className="bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/5 overflow-hidden border border-gray-100">
          <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: academicBlue }}>
            <div>
              <h1 className="text-2xl font-black mb-1">إعدادات حساب الطالب</h1>
              <p className="text-blue-100/70 text-sm">أهلاً بك {user?.name || ''}، حدّث بياناتك وقتما تشاء</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <FaGraduationCap className="text-2xl" style={{ color: academicGold }} />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-8 space-y-10">
            {message && <p className="rounded-2xl bg-green-50 text-green-700 border border-green-100 px-4 py-3 text-sm font-bold">{message}</p>}
            {error && <p className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">{error}</p>}

            <section>
              <h2 className="text-lg font-black mb-6 flex items-center gap-3" style={{ color: academicBlue }}>
                <FaUser className="text-sm" /> المعلومات الشخصية
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-1">الاسم الكامل</label>
                  <div className="relative">
                    <FaUser className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="text" name="name" value={settings.name} onChange={handleChange} className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-1">رقم الهاتف</label>
                  <div className="relative">
                    <FaPhone className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="tel" name="phone" value={settings.phone} onChange={handleChange} className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-1">البريد الإلكتروني</label>
                  <div className="relative">
                    <FaEnvelope className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300" />
                    <input type="email" name="email" value={settings.email} onChange={handleChange} className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none" />
                  </div>
                </div>
                <div className="md:col-span-2 space-y-2">
                  <label className="text-xs font-bold text-gray-400 mr-1">الجنس</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {GENDER_OPTIONS.map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-sm font-bold cursor-pointer ${
                          settings.gender === option.value
                            ? 'border-academic-blue bg-blue-50 text-academic-blue'
                            : 'border-gray-200 bg-gray-50 text-gray-600'
                        }`}
                      >
                        <input
                          type="radio"
                          name="gender"
                          value={option.value}
                          checked={settings.gender === option.value}
                          onChange={handleChange}
                          className="sr-only"
                        />
                        {option.label}
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            <section className="pt-6 border-t border-gray-100">
              <h2 className="text-lg font-black mb-6 flex items-center gap-3" style={{ color: academicBlue }}>
                <FaLock className="text-sm" /> أمان الحساب
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="password" name="currentPassword" placeholder="كلمة المرور الحالية" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={settings.currentPassword} onChange={handleChange} />
                <input type="password" name="newPassword" placeholder="كلمة مرور جديدة" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={settings.newPassword} onChange={handleChange} />
                <input type="password" name="confirmPassword" placeholder="تأكيد الكلمة" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={settings.confirmPassword} onChange={handleChange} />
              </div>
            </section>

            <button
              type="submit"
              disabled={busy}
              className="w-full py-4 rounded-2xl text-white font-bold disabled:opacity-50"
              style={{ backgroundColor: academicBlue }}
            >
              {busy ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

StudentSettings.propTypes = {};
