import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import Header from '../../components/header/header';
import HeaderHome from '../../components/header/headerHome';
import FooterHome from '../../components/footer/footerHome';
import { useAuth } from '../../context/AuthContext';

const academicBlue = '#1A5276';

export default function LegalLayout({ title, subtitle, children }) {
  const { isAuthenticated } = useAuth();

  return (
    <div className="font-tajawal bg-gray-50 min-h-screen" dir="rtl">
      {isAuthenticated ? <HeaderHome /> : <Header />}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <p className="text-sm font-bold text-gray-400 mb-3">
          <Link to="/" className="hover:text-academic-blue">الرئيسية</Link>
          <span className="mx-2">/</span>
          {title}
        </p>
        <h1 className="text-4xl md:text-5xl font-black mb-4" style={{ color: academicBlue }}>{title}</h1>
        {subtitle && <p className="text-lg text-gray-600 leading-relaxed mb-10">{subtitle}</p>}
        <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8 md:p-10 space-y-6 text-gray-700 leading-8">
          {children}
        </div>
      </main>
      <FooterHome />
    </div>
  );
}

LegalLayout.propTypes = {
  title: PropTypes.string.isRequired,
  subtitle: PropTypes.string,
  children: PropTypes.node.isRequired,
};
