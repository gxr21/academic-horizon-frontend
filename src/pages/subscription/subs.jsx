import Headers from "../../components/header/header";
import HeaderHome from "../../components/header/headerHome";
import { useAuth } from "../../context/AuthContext";
import SubscriptionCard from "../../components/crads/subscription";
import Footer from "../../components/footer/footer";
import FooterHome from "../../components/footer/footerHome";
import ClickSpark from "../../components/animate/clicker";
const academicBlue = '#1A5270';
const academicGold = '#E9C176';
function SubscriptionPage() {
    const { isAuthenticated } = useAuth();

    return (
        <div className="font-tajawal bg-white min-h-screen" dir="rtl">
            {isAuthenticated ? <HeaderHome /> : <Headers />}
            {/* === المحتوى الرئيسي === */}
            <main className="mian-content" dir="rtl">
                <section className="relative py-20 overflow-hidden bg-gray-50">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-academic-blue/5 rounded-l-full -z-10"></div>
                    <div className="container mx-auto px-6 flex flex-col items-center text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight">خطط الاسعار</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed ">تقدم باقات أكاديمية متكاملة مصممة لدعم مسيرتك التعليمية بأسعار رمزية  تنافسية تضمن لك الجودة و الاحترافية</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <SubscriptionCard
                          title='تقارير'
                          desc='حسب عدد الاسطر'
                          price ='2000 دينار'
                          animate={ClickSpark}
                        />
                        <SubscriptionCard
                          title='سيرة ذاتية '
                          desc='حسب التخصصات المطلوبة'
                          price ='10000 دينار'
                          id={2}
                          style={{ 
                             backgroundColor: academicGold ,
                             color:'#ffffff'
                          }}
                          animate={ClickSpark}
                          
                        />
                        <SubscriptionCard
                          title='عروض تقديمية '
                          desc='حسب السلايدرات المطلوبة'
                          price ='5000 دينار'
                          animate={ClickSpark}
                        />
                    </div>
                </section>
                <section className="py-24 container mx-auto px-6">
                    <div className="text-center mb-16">
                        <h2 className="text-academic-blue text-5xl ">لماذا تختارنا ؟</h2>
                        <div className="w-40 h-1  bg-academic-gold mx-auto rounded-full mt-4 mb-20"></div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <div className="flex flex-col justify-center items-center">
                                <div className="w-20 h-20 rounded-full  flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                 <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                                    </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-academic-blue">امان تام</h3>
                                <p className="text-gray-600">نضمن لك امان كامل لمحتواك</p>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <div className="w-20 h-20 rounded-full  flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99" />
                                </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-academic-blue">تحديث مستمر</h3>
                                <p className="text-gray-600">مواكبة دائمة لأحداث معايير الجامعات</p>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <div className="w-20 h-20 rounded-full  flex items-center justify-center mb-4">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                                </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-academic-blue">أسعار رمزية</h3>
                                <p className="text-gray-600">تكلفة مدروسة لتناسب ميزانية  الطالب</p>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <div className="w-20 h-20 rounded-full  flex items-center justify-center mb-4">
                                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                     <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                                      </svg>
                                </div>
                                <h3 className="text-2xl font-bold text-academic-blue">امان تام</h3>
                                <p className="text-gray-600">نضمن لك امان كامل لمحتواك</p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                    {isAuthenticated ? <FooterHome /> : <Footer />}
                </section>
            </main>
        </div>
    );
}
export default SubscriptionPage;
