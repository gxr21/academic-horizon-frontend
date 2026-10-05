import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Input from '../../components/input/input.jsx';
import Button from '../../components/buttons/button.jsx';
const academicFont = 'Tajawal';
function LoginPage () {
  const [role, setRole] = useState('student');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { login } = useAuth();

  useEffect(() => {
    const stored = sessionStorage.getItem('authError');
    if (stored) {
      setError(stored);
      sessionStorage.removeItem('authError');
    }
  }, []);

  const handleLogin = async () => {
    setError('');
    if (!email || !password) {
      setError('البريد الإلكتروني وكلمة المرور مطلوبان');
      return;
    }

    setIsLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        // توجيه المستخدم بناءً على نوع الحساب
        if (result.user.role === 'provider') {
          navigate('/dashboard');
        } else if (result.user.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/home');
        }
      } else {
        setError(result.error);
      }
    } catch {
      setError('حدث خطأ أثناء تسجيل الدخول');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
    {/* === الجانب الايسر ===*/}
  <div className="flex justify-center items-center w-full h-screen bg-white">
    <div className="login-container w-[950px] h-[750px] bg-white/80 backdrop-blur-sm rounded-3xl shadow-2xl flex">
      <div className="signin-side flex-1 flex justify-center items-center flex-col">
        <h1 className="text-4xl font-bold text-academic-blue relative bottom-4 left-14 -translate-y-14 " style={{fontFamily: academicFont }}>تسجيل الدخول</h1>
        <div className="bg-gray-200 w-[350px] h-[50px] relative bottom-4 -translate-y-10 rounded-lg flex flex-row items-center justify-center gap-4 -translate-x-0">
          <div className="w-[250px]" dir="rtl"> 
            <Button 
              className={`${role === 'student' ? 'bg-academic-blue text-white' : 'bg-gray-200 text-academic-blue'} w-[170px] h-[50px] rounded-lg transition-all ease-in-out font-bold`}
              style={{fontFamily: academicFont}}
              onClick={() => setRole('student')}>طالب
            </Button>
          </div>
          <div className="w-[250px]">
            <Button
              className={`${role === 'provider' ? 'bg-academic-blue text-white' : 'bg-gray-200 text-academic-blue'} w-[170px] h-[50px] rounded-lg transition-all ease-in-out font-bold`}
              style={{fontFamily: academicFont}}
              onClick={() => setRole('provider')}>مقدم خدمة
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-4 ">
          <div className="flex flex-col">
            <label className="text-academic-blue border- font-bold text-right flex flex-col gap-2 text-[18px]" dir="rtl">البريد الإلكتروني</label>
            <Input type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              svg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
              </svg>}
              placeholder="البريد الإلكتروني"
              className="border border-gray-300 rounded-lg p-3 w-80 mt-4 text-right"
            />
          </div>
          <div className="flex flex-col">
            <label className="text-academic-blue font-bold text-right flex flex-col gap-2 text-[18px]" dir="rtl">كلمة المرور</label>
            <Link to='/forgot-password'>
              <p style={{fontFamily: academicFont}}>نسيت كلمة المرور؟</p>
            </Link>
            <Input type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="كلمة المرور"
              className="border border-gray-300 rounded-lg p-3 w-80 mt-4 text-right"
              svg={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
              </svg>}
            />
          </div>
        </div>
        {error && (
          <div className="mt-2 w-80">
            <p className="text-red-500 text-sm text-right">{error}</p>
          </div>
        )}
        <Button 
          onClick={handleLogin}
          disabled={isLoading}
          className="bg-academic-blue text-lg text-white rounded-lg p-3 w-80 mt-4 text-right flex justify-center items-center transtion-all duration-300 hover:bg-academic-blue-dark disabled:opacity-50">
         {isLoading ? 'جاري تسجيل الدخول...' : 'دخول للمنصة'}
        </Button>
        {/* <div className="flex flex-col gap-4 mt-4 ">
          <p className="text-center text-gray-500">أو</p>
          <Button className="bg-white text-lg text-academic-blue rounded-lg p-3 w-80 mt-4 text-right flex justify-center items-center border border-academic-blue gap-2 transtion-all duration-300 hover:bg-academic-blue hover:text-white">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.182 15.182a4.5 4.5 0 0 1-6.364 0M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM9.75 9.75c0 .414-.168.75-.375.75S9 10.164 9 9.75 9.168 9 9.375 9s.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Zm5.625 0c0 .414-.168.75-.375.75s-.375-.336-.375-.75.168-.75.375-.75.375.336.375.75Zm-.375 0h.008v.015h-.008V9.75Z" />
            </svg>
            تسجيل الدخول عبر جوجل
          </Button>
        </div> */}
        <div className="flex flex-col gap-4 mt-4 ">
          <Link to='/signup' className="text-academic-blue">
            <p className="text-center text-gray-500" style={{fontFamily: academicFont}}>ليس لديك حساب؟</p>
          </Link>    
        </div>

      </div>
      {/* === الجانب الايمن === */}
      <div className="bg-academic-blue rounded-r-3xl  flex flex-col p-12 flex-1 h-full text-white relative overflow-hidden" dir="rtl">
        <img src='/assets/unnamed.png' alt="" className='absolute inset-0 w-full h-full object-cover -z-1 opacity-5'/>
        <div className="flex items-center gap-3 mb-16 logo-container">
          <span className="text-3xl" style={{ color: '#E9C176' }}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
            </svg>
          </span>
          <h1 className="text-3xl font-bold" style={{fontFamily: academicFont}}>الأفق الأكاديمي</h1>
        </div>
        <div className="signup-side-title">
          <h1 className="text-5xl font-extrabold leading-tight text-white text-right" style={{fontFamily: academicFont}}>مرحباً بك في مستقبلك الأكاديمي</h1>
          <p className="mt-4 text-lg text-gray-200 text-right leading-relaxed max-w-xl" style={{fontFamily: academicFont}}> 
            نؤمن بأن المعرفة هي أرقى أشكال الاستثمار، انضم إلى منصتنا الرائدة لربط العقول المبدعة بالفرص التعليمية المتميزة.
          </p>
        </div>
        <div className="w-[400px] h-[260px] bg-white/20 backdrop-blur-sm shadow-lg rounded-2xl relative top-20 -translate-y-4 p-4">
          <div className="flex items-center gap-4">
            <div className="w-[70px] h-[70px] bg-academic-gold rounded-full flex items-center justify-center shadow-md"> 
              <img src='https://randomuser.me/api/portraits/women/44.jpg' alt='user_png' className="rounded-full  object-cover" />
            </div>
            <div className="flex flex-col">
              <p className="text-white text-xl font-bold" style={{fontFamily: academicFont}}>سارة محمد</p>
              <p className="text-academic-gold text-lg font-semibold" style={{fontFamily: academicFont}}>باحث اكاديمي</p>
            </div>
          </div>
          <div className="mt-6 pt-4 border-t border-white/20">
            <p className="text-gray-100 text-sm leading-relaxed italic" style={{fontFamily: academicFont}}>
              &quot;وجدت في الأفق الأكاديمي بيئة تعليمية تضاهي الجامعات العالمية في جودة المحتوى وسهولة الوصول.&quot;
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
    </>
  );
};
export default LoginPage;
