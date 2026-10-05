import { Link } from "react-router-dom";
const academicFont = 'Tajawal';

const FooterHome = () => {
    return (
        <footer className="bg-academic-blue text-white py-12">
            <div className="container mx-auto px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* القسم الأول: معلومات المنصة */}
                    <div className="flex flex-col gap-4">
                        <div className="flex items-center gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-8 text-academic-gold">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                            </svg>
                            <h3 className="text-xl font-bold" style={{fontFamily: academicFont}}>الأفق الأكاديمي</h3>
                        </div>
                        <p className="text-gray-300 text-sm leading-relaxed">
                            منصة رائدة في تقديم الخدمات الأكاديمية والبحثية للطلاب والباحثين.
                        </p>
                    </div>

                    {/* القسم الثاني: روابط سريعة */}
                    <div>
                        <h4 className="text-lg font-bold mb-4" style={{fontFamily: academicFont}}>روابط سريعة</h4>
                        <ul className="space-y-2">
                            <li>
                                <Link to="/home" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    الرئيسية
                                </Link>
                            </li>
                            <li>
                                <Link to="/services" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    خدماتنا
                                </Link>
                            </li>
                            <li>
                                <Link to="/price" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    الأسعار
                                </Link>
                            </li>
                            <li>
                                <Link to="/about" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    من نحن
                                </Link>
                            </li>
                            <li>
                                <Link to="/help" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    المساعدة
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    سياسة الخصوصية
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-gray-300 hover:text-academic-gold transition-colors">
                                    شروط الاستخدام
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* القسم الثالث: الخدمات */}
                    <div>
                        <h4 className="text-lg font-bold mb-4" style={{fontFamily: academicFont}}>خدماتنا</h4>
                        <ul className="space-y-2">
                            <li className="text-gray-300">كتابة التقارير</li>
                            <li className="text-gray-300">العروض التقديمية</li>
                            <li className="text-gray-300">السير الذاتية</li>
                            <li className="text-gray-300">البحوث العلمية</li>
                        </ul>
                    </div>

                    {/* القسم الرابع: تواصل معنا */}
                    <div>
                        <h4 className="text-lg font-bold mb-4" style={{fontFamily: academicFont}}>تواصل معنا</h4>
                        <ul className="space-y-3">
                            <li className="flex items-center gap-3 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
                                </svg>
                                info@academichorizon.com
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 0 0 2.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 0 1-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 0 0-1.091-.852H4.5A2.25 2.25 0 0 0 2.25 4.5v2.25Z" />
                                </svg>
                                +964 123 456 789
                            </li>
                            <li className="flex items-center gap-3 text-gray-300">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
                                </svg>
                                البصرة، العراق
                            </li>
                        </ul>
                        {/* وسائل التواصل الاجتماعي */}
                        <div className="flex gap-4 mt-4">
                            <a href="#" className="text-gray-300 hover:text-academic-gold transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="size-6" viewBox="0 0 24 24">
                                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-academic-gold transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="size-6" viewBox="0 0 24 24">
                                    <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-academic-gold transition-colors">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" className="size-6" viewBox="0 0 24 24">
                                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                            </a>
                        </div>
                    </div>
                </div>

                {/* حقوق النشر */}
                <div className="border-t border-white/20 mt-8 pt-8 text-center">
                    <p className="text-gray-300 text-sm">
                        © 2026 الأفق الأكاديمي. جميع الحقوق محفوظة.
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default FooterHome;
