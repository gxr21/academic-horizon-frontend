import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';

const Footer = ({ children }) => {
    return (
        <div className="container mx-auto px-6">
            <h2 className="text-3xl font-bold mb-6">هل أنت جاهز للتميز في دراستك؟</h2>
            <p className="text-blue-100 mb-8 max-w-lg mx-auto opacity-80">
                انضم لأكثر من 1000 طالب يعتمدون على الأفق الأكاديمي في رحلتهم التعليمية.
            </p>
            <button className="bg-academic-gold text-academic-blue px-10 py-4 rounded-full font-bold hover:scale-105 transition-transform">
                <Link to="/signup">انشاء حساب مجاني</Link>
            </button>
            <div className="flex flex-wrap justify-center gap-5 mt-8 text-sm text-blue-100">
                <Link to="/help" className="hover:text-academic-gold">المساعدة</Link>
                <Link to="/privacy" className="hover:text-academic-gold">سياسة الخصوصية</Link>
                <Link to="/terms" className="hover:text-academic-gold">شروط الاستخدام</Link>
            </div>
            {children}
        </div>
    );
};

Footer.propTypes = {
    children: PropTypes.node
};

export default Footer;