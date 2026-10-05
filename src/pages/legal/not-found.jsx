import { Link } from 'react-router-dom';
import Header from '../../components/header/header';
import HeaderHome from '../../components/header/headerHome';
import { useAuth } from '../../context/AuthContext';

const academicBlue = '#1A5276';

export default function NotFoundPage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="min-h-screen bg-gray-50 font-tajawal" dir="rtl">
      {isAuthenticated ? <HeaderHome /> : <Header />}
      <main className="min-h-[70vh] flex flex-col items-center justify-center px-6 text-center">
        <p className="text-7xl font-black" style={{ color: academicBlue }}>404</p>
        <h1 className="text-3xl font-black text-gray-800 mt-4">الصفحة غير موجودة</h1>
        <p className="text-gray-500 mt-3 mb-8">الرابط غير صحيح أو نُقلت الصفحة.</p>
        <div className="flex gap-3">
          <Link to="/" className="px-6 py-3 rounded-xl text-white font-bold" style={{ backgroundColor: academicBlue }}>
            الرئيسية
          </Link>
          <Link to="/help" className="px-6 py-3 rounded-xl border font-bold text-academic-blue">
            المساعدة
          </Link>
        </div>
      </main>
    </div>
  );
}
