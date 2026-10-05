import { useEffect, useState } from 'react';
import { FaUser, FaPhone, FaEnvelope, FaLock, FaArrowRight, FaIdCard, FaPaperclip } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { userAPI, profileChangesAPI } from '../../lib/api';

const academicBlue = '#1A5276';
const academicGold = '#E9C176';

const STATUS_LABEL = {
  pending: { text: 'قيد مراجعة الإدارة', className: 'bg-orange-50 text-orange-700 border-orange-100' },
  approved: { text: 'تمت الموافقة', className: 'bg-green-50 text-green-700 border-green-100' },
  rejected: { text: 'مرفوض', className: 'bg-red-50 text-red-700 border-red-100' },
};

export default function ProviderSettings() {
  const navigate = useNavigate();
  const { user, refreshUser, updateUser } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    email: user?.email || '',
    bio: user?.bio || '',
    note: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [documents, setDocuments] = useState([]);
  const [requests, setRequests] = useState([]);
  const [busy, setBusy] = useState(false);
  const [passwordBusy, setPasswordBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const pending = requests.find((r) => r.status === 'pending');

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: user?.name || '',
      phone: user?.phone || '',
      email: user?.email || '',
      bio: user?.bio || '',
    }));
  }, [user]);

  useEffect(() => {
    profileChangesAPI
      .mine()
      .then((res) => setRequests(res.data?.requests || []))
      .catch(() => {});
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleFiles = (e) => {
    const files = Array.from(e.target.files || []).slice(0, 5);
    setDocuments(files);
    e.target.value = '';
  };

  const handleRequestChange = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (pending) {
      setError('لديك طلب قيد المراجعة. انتظر قرار الإدارة قبل إرسال طلب جديد.');
      return;
    }
    if (documents.length === 0) {
      setError('ارفع صورة الهوية أو مستمسكاً رسمياً واحداً على الأقل.');
      return;
    }
    setBusy(true);
    try {
      const data = new FormData();
      data.append('name', form.name.trim());
      data.append('phone', form.phone.trim());
      data.append('email', form.email.trim());
      data.append('bio', form.bio.trim());
      data.append('note', form.note.trim());
      documents.forEach((file) => data.append('documents', file));
      const res = await profileChangesAPI.create(data);
      setRequests((prev) => [res.data.request, ...prev]);
      setDocuments([]);
      setForm((prev) => ({ ...prev, note: '' }));
      setMessage('أُرسل طلب التغيير إلى الإدارة مع المستمسكات.');
    } catch (err) {
      setError(err.message || 'تعذر إرسال الطلب');
    } finally {
      setBusy(false);
    }
  };

  const handlePassword = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    if (!form.currentPassword || !form.newPassword) {
      setError('أدخل كلمة المرور الحالية والجديدة');
      return;
    }
    if (form.newPassword.length < 6) {
      setError('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل');
      return;
    }
    if (form.newPassword !== form.confirmPassword) {
      setError('تأكيد كلمة المرور غير مطابق');
      return;
    }
    setPasswordBusy(true);
    try {
      const res = await userAPI.updateProfile({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      });
      if (res.data?.user) updateUser(res.data.user);
      else await refreshUser();
      setForm((prev) => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }));
      setMessage('تم تغيير كلمة المرور.');
    } catch (err) {
      setError(err.message || 'تعذر تغيير كلمة المرور');
    } finally {
      setPasswordBusy(false);
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
              <h1 className="text-2xl font-black mb-1">طلب تغيير بيانات مزود الخدمة</h1>
              <p className="text-blue-100/70 text-sm">التغييرات الشخصية تصل للإدارة مع الهوية للمراجعة</p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl border border-white/10">
              <FaIdCard className="text-2xl" style={{ color: academicGold }} />
            </div>
          </div>

          <div className="p-8 space-y-10">
            {pending && (
              <p className={`rounded-2xl border px-4 py-3 text-sm font-bold ${STATUS_LABEL.pending.className}`}>
                لديك طلب تغيير قيد المراجعة منذ {new Date(pending.createdAt).toLocaleString('ar-EG')}.
              </p>
            )}
            {message && <p className="rounded-2xl bg-green-50 text-green-700 border border-green-100 px-4 py-3 text-sm font-bold">{message}</p>}
            {error && <p className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">{error}</p>}

            <form onSubmit={handleRequestChange} className="space-y-8">
              <section>
                <h2 className="text-lg font-black mb-6 flex items-center gap-3" style={{ color: academicBlue }}>
                  <FaUser className="text-sm" /> البيانات المطلوبة
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Field icon={<FaUser />} label="الاسم الكامل" name="name" value={form.name} onChange={handleChange} />
                  <Field icon={<FaPhone />} label="رقم الهاتف" name="phone" value={form.phone} onChange={handleChange} type="tel" />
                  <div className="md:col-span-2">
                    <Field icon={<FaEnvelope />} label="البريد الإلكتروني" name="email" value={form.email} onChange={handleChange} type="email" />
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-xs font-bold text-gray-400 mr-1">الوصف التعريفي</label>
                    <textarea
                      name="bio"
                      rows={4}
                      maxLength={1000}
                      value={form.bio}
                      onChange={handleChange}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-academic-blue outline-none"
                      placeholder="نبذة تظهر للطلاب في ملفك الشخصي"
                    />
                  </div>
                </div>
              </section>

              <section className="pt-6 border-t border-gray-100 space-y-4">
                <h2 className="text-lg font-black flex items-center gap-3" style={{ color: academicBlue }}>
                  <FaPaperclip className="text-sm" /> المستمسكات
                </h2>
                <p className="text-sm text-gray-500">ارفع الهوية الشخصية أو مستمسكاً رسمياً يثبت صحة البيانات (حتى 5 ملفات).</p>
                <label className="block cursor-pointer">
                  <input type="file" multiple accept="image/*,.pdf" onChange={handleFiles} className="hidden" />
                  <span className="inline-flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-50 border border-dashed border-gray-300 text-sm font-bold text-gray-600">
                    <FaPaperclip /> اختيار الملفات
                  </span>
                </label>
                {documents.length > 0 && (
                  <ul className="text-sm text-gray-600 space-y-1">
                    {documents.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                )}
                <textarea
                  name="note"
                  rows={3}
                  maxLength={500}
                  value={form.note}
                  onChange={handleChange}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  placeholder="ملاحظة للإدارة (اختياري)"
                />
              </section>

              <button
                type="submit"
                disabled={busy || !!pending}
                className="w-full py-4 rounded-2xl text-white font-bold disabled:opacity-50"
                style={{ backgroundColor: academicBlue }}
              >
                {busy ? 'جاري الإرسال...' : 'طلب تغيير'}
              </button>
            </form>

            {requests.length > 0 && (
              <section className="pt-6 border-t border-gray-100 space-y-3">
                <h2 className="text-lg font-black" style={{ color: academicBlue }}>سجل الطلبات</h2>
                {requests.map((req) => {
                  const meta = STATUS_LABEL[req.status] || STATUS_LABEL.pending;
                  return (
                    <div key={req.id} className={`rounded-2xl border px-4 py-3 text-sm ${meta.className}`}>
                      <p className="font-bold">{meta.text}</p>
                      <p className="opacity-80 mt-1">{new Date(req.createdAt).toLocaleString('ar-EG')}</p>
                      {req.adminNote && <p className="mt-1">ملاحظة الإدارة: {req.adminNote}</p>}
                    </div>
                  );
                })}
              </section>
            )}

            {/* <form onSubmit={handlePassword} className="pt-6 border-t border-gray-100 space-y-4">
              <h2 className="text-lg font-black flex items-center gap-3" style={{ color: academicBlue }}>
                <FaLock className="text-sm" /> تغيير كلمة المرور
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="password" name="currentPassword" placeholder="الحالية" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.currentPassword} onChange={handleChange} />
                <input type="password" name="newPassword" placeholder="الجديدة" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.newPassword} onChange={handleChange} />
                <input type="password" name="confirmPassword" placeholder="تأكيد الجديدة" className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm" value={form.confirmPassword} onChange={handleChange} />
              </div>
              <button
                type="submit"
                disabled={passwordBusy}
                className="w-full py-3 rounded-2xl font-bold border border-gray-200 text-gray-700 disabled:opacity-50"
              >
                {passwordBusy ? 'جاري التحديث...' : 'تحديث كلمة المرور'}
              </button>
            </form> */}
          </div>
        </div>
      </div>
    </div>
  );
}

const Field = ({ icon, label, ...props }) => (
  <div className="space-y-2">
    <label className="text-xs font-bold text-gray-400 mr-1">{label}</label>
    <div className="relative">
      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300">{icon}</span>
      <input {...props} className="w-full pr-12 pl-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:border-academic-blue outline-none" />
    </div>
  </div>
);
