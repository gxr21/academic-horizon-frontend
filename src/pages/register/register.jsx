import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/input/input';
import Button from '../../components/buttons/button';
import GoogleSignInButton from '../../components/google/GoogleSignInButton';
const img_user = [
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/45.jpg',
  'https://randomuser.me/api/portraits/women/65.jpg'
];
function RegisterPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [verfiyPassword, setVerfiyPassword] = useState('');
  const [error, setError] = useState('');
  const role = 'student';
  const navigate = useNavigate();
  const { register, loginWithGoogle } = useAuth();
  const handleGoogle = async (credential) => {
    setError('');
    const result = await loginWithGoogle(credential);
    if (!result.success) {
      setError(result.error);
      return;
    }
    // An existing provider/admin who signs in here still lands on their own page
    if (result.user.role === 'provider') navigate('/dashboard');
    else if (result.user.role === 'admin') navigate('/admin');
    else navigate('/home');
  };
  const handleRegister = async () => {
    setError('');
    if (!name || !email || !password) {
      setError('جميع الحقول مطلوبة');
      return;
    }
    if (password !== verfiyPassword) {
      setError('كلمات المرور غير متطابقة');
      return;
    }
    const result = await register(name, email, password, role);
    if (result.success) {
      // توجيه المستخدم بعد التسجيل الناجح
      navigate('/home');
    } else {
      setError(result.error);
    }
  };
  return (
    <div className="flex justify-center items-center w-full min-h-screen py-8 bg-gray-100 font-tajawal">
      {/* الحاوية الرئيسية */}
      <div className="register-container w-[1000px] min-h-[750px] bg-white rounded-3xl shadow-2xl flex overflow-hidden">
        {/* === الجانب الأيسر (نموذج التسجيل) === */}
        <div className="register-side flex-1 flex flex-col justify-center items-center p-12 bg-white" dir="rtl">
          <div className="w-full max-w-sm">
            <h1 className="text-4xl font-bold text-academic-blue mb-2 text-right">إنشاء حساب جديد</h1>
            <p className="text-gray-500 mb-8 text-right text-sm">ابدأ رحلتك الأكاديمية معنا اليوم</p>
            <p className="text-academic-blue font-bold text-right mb-4">إنشاء حساب طالب</p>

            <div className="flex flex-col gap-4 border-b border-gray-300 pb-4 mb-4">
              <Input 
                type='text'
                placeholder="الاسم الكامل"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3  mt-4 text-right"
                svg={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                  </svg>
                }
              />
              <Input 
                type='email'
                placeholder="البريد الإلكتروني"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3  mt-4 text-right"
                svg={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                  </svg>
                }
              />
              <Input
                type='password'
                placeholder="كلمة المرور"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3  mt-4 text-right"
                svg={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                }
              />
              <Input
                type='password'
                placeholder="تأكيد كلمة المرور"
                value={verfiyPassword}
                onChange={(e) => setVerfiyPassword(e.target.value)}
                className="w-full border border-gray-300 rounded-lg p-3  mt-4 text-right"
                svg={
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                  </svg>
                }
              />
              <p className="text-gray-500 text-sm text-right mt-2">
                التسجيل متاح للطلاب فقط. مزود الخدمة يتم تفعيله عبر إيميل معتمد.
              </p>
              {/* يمكنك إضافة بقية الحقول هنا بنفس الطريقة */}
              {error && (
                <p className="text-red-500 text-sm text-right">{error}</p>
              )}
              <Button 
                onClick={handleRegister}
                className="bg-academic-blue text-white w-full py-3 rounded-xl mt-4 font-bold hover:opacity-90 transition shadow-lg">
                إنشاء حساب
              </Button>
              <div className="flex items-center gap-3 mt-1" dir="rtl">
                <span className="flex-1 h-px bg-gray-200" />
                <span className="text-sm text-gray-400">أو</span>
                <span className="flex-1 h-px bg-gray-200" />
              </div>
              <GoogleSignInButton text="signup_with" width={384} onCredential={handleGoogle} />
            </div>
            <p className="mt-8 text-center text-gray-500 text-sm">
              لديك حساب بالفعل؟ <Link to="/login" className="text-academic-blue font-bold">تسجيل الدخول</Link>
            </p>
          </div>
        </div>
        {/* === الجانب الأيمن (الهوية البصرية) === */}
        <div className="bg-white flex flex-col p-12 flex-1 self-stretch text-white relative overflow-hidden shadow-2xl" dir="rtl">
          {/* خلفية جمالية خفيفة */}
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_top_left,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          {/* اللوغو */}
          <div className="flex items-center gap-3 mb-12 relative z-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-gold">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
            <h1 className="text-2xl text-academic-blue font-bold">الأفق الأكاديمي</h1> 
          </div>
          {/* العنوان الترحيبي */}
          <div className="relative z-10">
            <h1 className="text-5xl font-extrabold leading-tight text-academic-blue">انضم إلى</h1>
            <h2 className="text-5xl font-extrabold leading-tight text-[#008080]">جيل المستقبل</h2>
            <p className="mt-6 text-gray-500 text-lg font-medium opacity-90 leading-relaxed">
              بوابتك الأكاديمية المتطورة للوصول إلى أرقى <br />
              الخدمات التعليمية والمهنية بأسلوب عصري ومبسط.
            </p>
          </div>
          {/* قسم الطلاب المنضمين */}
          <div className="mt-12 flex items-center gap-4 relative z-10">
            <div className="flex -space-x-3 space-x-reverse">
              {img_user.map((path, index) => (
                <div key={index} className="size-10 bg-academic-gold rounded-full border-2 border-[#008080] flex items-center justify-center overflow-hidden shadow-lg">
                   {/* <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="size-6 text-academic-blue">
                      <path strokeLinecap="round" strokeLinejoin="round" d={path} />
                   </svg> */}
                   <img src={img_user[index]} alt="user"/>
                </div>
              ))}
            </div>
            <p className="text-sm font-bold text-gray-500">أكثر من 1000+ طالب انضموا إلينا بالفعل</p>
          </div>

          {/* بطاقة التقييم (Testimonial Card) */}
          <div className="mt-auto relative z-10 flex justify-center pb-8">
            <div className="bg-academic-gold/90 backdrop-blur-md w-full max-w-[380px] p-6 rounded-2xl rotate-2 shadow-2xl text-academic-blue border border-white/20">
              <span className="text-4xl font-serif leading-none block mb-2">&ldquo;</span>
              <p className="text-[15px] font-bold leading-relaxed mb-4">
              "وجدت وجدت في الأفق الأكاديمي بيئة تعليمية تضاهي الجامعات العالمية في جودة المحتوى وسهولة الوصول."
              </p>
              <div className="flex items-center justify-between border-t border-academic-blue/10 pt-3">
                <p className="text-xs font-black opacity-80">سارة محمد، طالبة دراسات عليا</p>
                <div className="flex text-amber-900 text-[10px]">★★★★★</div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default RegisterPage;
