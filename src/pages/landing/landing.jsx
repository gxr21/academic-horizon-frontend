import Header from "../../components/header/header.jsx";
import HeaderHome from "../../components/header/headerHome.jsx";
import Footer from "../../components/footer/footer.jsx";
import FooterHome from "../../components/footer/footerHome.jsx";
import { useAuth } from "../../context/AuthContext";
import { ServiceCard } from "../../components/crads/cards.jsx";
import ClickSpark from "../../components/animate/clicker.jsx";
import { Link } from "react-router-dom";
const academicBlue = '#1A5276';
const academicGold = '#E9C176';
function LandingPage() {
    const { isAuthenticated } = useAuth();
    return (    
        <div className="font-tajawal bg-white min-h-screen" dir="rtl">
            {/* === الهيدر === */}
            {isAuthenticated ? <HeaderHome /> : <Header />}
            <main className="main-content">
                {/* === Hero Section (قسم الترحيب) === */}
                <section className="relative py-20 overflow-hidden bg-gray-50">
                    {/* لمسة جمالية للخلفية */}
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-academic-blue/5 rounded-l-full -z-10"></div>   
                    <div className="container mx-auto px-6 flex flex-col items-center text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight" style={{ color: academicBlue }}>
                            مستقبلك الأكاديمي <br /> 
                            <span className="text-academic-gold" style={{ color: academicGold }}>يبدأ من هنا</span>
                        </h1>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
                            نحن نربطك بأفضل الخبراء الأكاديميين لإنجاز أبحاثك، تقاريرك، وعروضك التقديمية بأعلى معايير الجودة والاحترافية.
                        </p>
                        <div className="flex gap-4">
                            <button className="bg-academic-blue text-white px-8 py-4 rounded-xl font-bold shadow-lg hover:shadow-academic-blue/30 ">
                             <Link to='/price'>
                                  اطلب خدمتك الآن
                             </Link>
                            </button>
                            <button className="border-2 border-academic-gold text-academic-blue px-8 py-4 rounded-xl font-bold hover:bg-academic-gold hover:text-white transition-all">
                                <Link to='/services'>
                                    استكشف خدماتنا
                                </Link>
                            </button>
                        </div>
                    </div>
                </section>
                {/* === Services Section (قسم الخدمات الثلاث) === */}
                <section className="py-24 container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-academic-blue mb-4">خدماتنا المتميزة</h2>
                        <div className="w-20 h-1 bg-academic-gold mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {/* بطاقة الأبحاث */}
                        <ServiceCard 
                            title="السير الذاتية" 
                            desc="إعداد أبحاث علمية رصينة وفق المنهجيات المعتمدة عالمياً مع ضمان الأصالة."
                            link='/services'
                            icon={
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                </svg>
                            }
                            animate={ClickSpark}
                        />
                        {/* بطاقة العروض */}
                        <ServiceCard 
                            title="العروض التقديمية" 
                            desc="تصميم عروض PowerPoint احترافية تجذب الانتباه وتعكس محتواك بوضوح."
                            link ='/services'
                            icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 ">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                            </svg>
                             } 
                             animate={ClickSpark}
                            />
                        {/* بطاقة التقارير */}
                        <ServiceCard    
                            title="التقارير العلمية" 
                            desc="كتابة تقارير دقيقة ومنظمة تغطي كافة الجوانب الفنية والأكاديمية المطلوبة."
                            link='services'
                            icon = {<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                            </svg>}
                            animate={ClickSpark}
                        />
                    </div>
                </section>
                {/* === الأسئلة الشائعة === */}
                <section className="py-16 bg-gray-50">
                    <div className="container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-academic-blue">الأسئلة الشائعة</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold mb-4 text-academic-blue">كيف يمكنني التسجيل في المنصة؟</h3>
                                <p className="text-gray-600">يمكنك التسجيل من خلال زر &quote;إنشاء حساب&quote; الموجود في أعلى الصفحة، أو من خلال زر &quote;ابدأ الآن &quote; في قسم الميزات.</p>
                            </div>
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <h3 className="text-xl font-semibold mb-4 text-academic-blue">هل المنصة مجانية؟</h3>
                                <p className="text-gray-600">نعم، المنصة مجانية بالكامل. نقدم خدماتنا التعليمية الأساسية مجانًا، مع إمكانية الترقية إلى خطط مدفوعة.</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* === التقييمات === */}
                <section>
                    <div className="container mx-auto px-6 py-16">
                        <h2 className="text-3xl font-bold text-center mb-12 text-academic-blue">تقييمات الطلاب</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {/* أول تقييم */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center mb-4">
                                    <img src="https://randomuser.me/api/portraits/women/44.jpg" alt="Student" className="w-12 h-12 rounded-full mr-4" />
                                    <div>
                                        <h3 className="font-semibold text-academic-blue">أحمد محمد</h3>
                                        <div className="flex text-academic-gold">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600">الأفق الأكاديمي منصة رائعة ساعدتني في تحسين مهاراتي الأكاديمية.</p>
                            </div>
                            {/* ثاني تقييم */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center mb-4">
                                    <img src="https://randomuser.me/api/portraits/men/45.jpg" alt="Student" className="w-12 h-12 rounded-full mr-4" />
                                    <div>
                                        <h3 className="font-semibold text-academic-blue">خالد عمر</h3>
                                        <div className="flex text-academic-gold">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600">تجربة مميزة جداً. أنصح به الطلاب الذين يريدون التفوق.</p>
                            </div>
                            {/* ثالث تقييم */}
                            <div className="bg-white p-6 rounded-lg shadow-md">
                                <div className="flex items-center mb-4">
                                    <img src="https://randomuser.me/api/portraits/women/65.jpg" alt="Student" className="w-12 h-12 rounded-full mr-4" />
                                    <div>
                                        <h3 className="font-semibold text-academic-blue">سارة أحمد</h3>
                                        <div className="flex text-academic-gold">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                                <p className="text-gray-600">من أفضل المنصات التعليمية التي استخدمتها. شكراً لفريق الأفق الأكاديمي!</p>
                            </div>
                        </div>
                    </div>
                </section>
                {/* === CTA Section (قسم دعوة للاشتراك) === */}
                <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                    {isAuthenticated ? <FooterHome /> : <Footer />}
                </section>
            </main>
        </div>
    );
}
export default LandingPage;
