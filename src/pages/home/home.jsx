import { useAuth } from "../../context/AuthContext";
import Header from "../../components/header/header";
import HeaderHome from "../../components/header/headerHome";
import Footer from "../../components/footer/footer";
import FooterHome from "../../components/footer/footerHome";
import { Link } from "react-router-dom";
const academicBlue = '#1A5276';
const academicGreen = "#008080";
const img_academic = '/assets/academic_envirment.png'
function HomePage() {
    const { isAuthenticated } = useAuth();
    
    return (
        <>
         <div className="font-tajawal bg-white min-h-screen" dir="rtl">
            {isAuthenticated ? <HeaderHome /> : <Header />}
            {/* === المحتوى الرئيسي === */}
            <main className="mian-content" dir="rtl">
                <section className="relative py-20 overflow-hidden bg-gray-50">
                <div className="relative py-20 overflow-hidden bg-gray-50 flex flex-row ">
                   <div className="absolute top-0 right-0 w-1/2 h-full bg-academic-blue/5 rounded-l-full -z-10"></div>
                   <div className="container mx-auto px-6 flex flex-col items-start text-right">
                       <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight " style={{ color: academicBlue }}>أنجاز بحثك العلمي</h1>
                       <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight " style={{ color: academicGreen }}>بأعلى المعايير المطلوبة</h1>
                       <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">نحن شريكك الموثوق في رحلتك الأكاديمية . نقدم دعما بحثيا متكاملا يشمل كافة مراحل البحث من اختيار  العنوان حتى التنسيق النهائي مع ضمان الأصالة و عدم الانتحال .</p> 
                       {/* <div className="grid grid-cols-2 gap-10">
                        <Button
                         className="bg-academic-blue flex flex-row gap-2 justify-center items-center text-white px-8 py-4 rounded-lg text-lg font-bold hover:bg-academic-blue/90 hover:text-academic-gold transition-colors duration-300"
                        //  onClick={handleClick}
                         style={{fontFamily: academicFont}}
                        > اطلب الخدمة الان
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 ">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                        </svg>
                        </Button>
                        <Button
                         className="border-academic-blue flex flex-row gap-2 justify-center items-center border-2 text-academic-blue px-8 py-4 rounded-lg text-lg font-bold hover:bg-academic-blue/90 hover:text-white transition-colors duration-300"
                        //  onClick={handleClick}
                         style={{fontFamily: academicFont}}
                        >عرض نماذج أعمالنا
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                         <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                         </svg>
                        </Button>
                        </div>                      */}
                   </div>
                   <div className="flex flex-col gap-4">
                    <div className="w-full h-full rounded-lg flex justify-center items-center">
                        <div className="flex flex-col justify-center items-center"></div>
                        <img src={img_academic} alt="photo" className="rounded-3xl  w-full h-full object-cover border-8 border-white"/>
                    </div>
                   </div>
                </div>
                </section>
                <section className="py-24 container mx-auto px-6">
                    <div className="text-center mb-16">
                        <p className="text-xl" style={{color:'#008080'}}>مكونات الخدمة</p>
                        <h1 className="text-4xl text-academic-blue font-bold mb-4">تغطية شاملة لكل متطلبات بحثك</h1>
                        <p className="text-2xl text-gray-500">نوفر لك كل ما تحتاجه في رحلة البحث من البداية الى النهاية</p>
                        <div className="w-80 h-1 bg-academic-gold mx-auto rounded-full mt-4"></div>
                    </div>
                </section>
                 <section className="py-24 container mx-auto px-6 bg-academic-gray-light/30 rounded-3xl mb-16">
                  <div className="flex flex-col items-center">
                     {/* <div className="text-center mb-16 max-w-2xl">
                         <h2 className="text-4xl md:text-5xl font-extrabold text-academic-blue mb-6 tracking-tight">اختر الخدمة التي تحتاجها</h2>
                         <p className="text-gray-600 text-lg leading-relaxed max-w-lg mx-auto">نحن هنا لمساعدتك في رحلتك الأكاديمية. اختر الخدمة المناسبة لتبدأ العمل فوراً مع خبرائنا.</p>
                         <div className="w-24 h-1 bg-academic-gold mx-auto rounded-full mt-6"></div>
                     </div> */}
                     {/* Services Grid */}
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-6xl">
                         {/* Card: Reports */}
                         <div className="group bg-white border border-gray-100 rounded-3xl p-10 transition-all duration-500 flex flex-col items-center text-center shadow-sm hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-academic-sky transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                             <div className="w-24 h-24 bg-academic-blue/5 text-academic-blue rounded-full flex items-center justify-center mb-8 group-hover:bg-academic-blue group-hover:text-white transition-colors duration-500 shadow-inner">
                                 <span className="material-symbols-outlined text-5xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0 2.77-.693a9 9 0 0 1 6.208.682l.108.054a9 9 0 0 0 6.086.71l3.114-.732a48.524 48.524 0 0 1-.005-10.499l-3.11.732a9 9 0 0 1-6.085-.711l-.108-.054a9 9 0 0 0-6.208-.682L3 4.5M3 15V4.5" />
                                    </svg>
                                 </span>
                             </div>
                             <h3 className="text-2xl font-bold text-academic-blue mb-4">تقارير</h3>
                             <p className="text-gray-500 mb-10 leading-relaxed text-base">كتابة تقارير أكاديمية وبحثية شاملة ومدققة وفقاً لأعلى المعايير التعليمية العالمية لضمان التفوق الأكاديمي.</p>
                             <Link to="/price" className="w-full">
                              <button className="mt-auto w-full bg-academic-blue text-white font-bold py-4 px-6 rounded-xl hover:bg-academic-blue-dark transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-md hover:shadow-lg">
                                 <span>عرض السعر</span>
                                 <span className="material-symbols-outlined text-xl transform group-hover:-translate-x-2 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                 </span>
                             </button>
                             </Link>
                         </div>
                         {/* Card: Presentations */}
                         <div className="group bg-white border border-gray-100 rounded-3xl p-10 transition-all duration-500 flex flex-col items-center text-center shadow-sm hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-academic-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                             <div className="w-24 h-24 bg-academic-blue/5 text-academic-blue rounded-full flex items-center justify-center mb-8 group-hover:bg-academic-blue group-hover:text-white transition-colors duration-500 shadow-inner">
                                 <span className="material-symbols-outlined text-5xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" />
                                   </svg>
                                 </span>
                             </div>
                             <h3 className="text-2xl font-bold text-academic-blue mb-4">عروض تقديمية</h3>
                             <p className="text-gray-500 mb-10 leading-relaxed text-base">تصميم عروض تقديمية احترافية وجذابة تساعدك على إيصال أفكارك بوضوح وتأثير عالي أمام جمهورك.</p>
                             <Link to="/price" className="w-full">
                              <button className="mt-auto w-full bg-academic-blue text-white font-bold py-4 px-6 rounded-xl hover:bg-academic-blue-dark transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-md hover:shadow-lg">
                                 <span>عرض السعر</span>
                                 <span className="material-symbols-outlined text-xl transform group-hover:-translate-x-2 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                 </span>
                             </button>
                             </Link>  
                         </div>
                         {/* Card: Scientific Research */}
                         <div className="group bg-white border border-gray-100 rounded-3xl p-10 transition-all duration-500 flex flex-col items-center text-center shadow-sm hover:shadow-2xl hover:-translate-y-3 relative overflow-hidden">
                             <div className="absolute top-0 left-0 w-full h-1 bg-academic-sky-dark transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
                             <div className="w-24 h-24 bg-academic-blue/5 text-academic-blue rounded-full flex items-center justify-center mb-8 group-hover:bg-academic-blue group-hover:text-white transition-colors duration-500 shadow-inner">
                                 <span className="material-symbols-outlined text-5xl">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                    </svg>
                                 </span>
                             </div>
                             <h3 className="text-2xl font-bold text-academic-blue mb-4">سير ذاتية </h3>
                             <p className="text-gray-500 mb-10 leading-relaxed text-base">إعداد وتنسيق الأبحاث العلمية بمنهجية دقيقة مع الالتزام التام بقواعد التوثيق الأكاديمي والأمانة العلمية.</p>
                             <Link to="/price" className="w-full">
                              <button className="mt-auto w-full bg-academic-blue text-white font-bold py-4 px-6 rounded-xl hover:bg-academic-blue-dark transition-all duration-300 active:scale-95 flex items-center justify-center gap-3 shadow-md hover:shadow-lg">
                                 <span>عرض السعر</span>
                                 <span className="material-symbols-outlined text-xl transform group-hover:-translate-x-2 transition-transform duration-300">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                                    </svg>
                                 </span>
                             </button>
                             </Link>
                         </div>
                     </div>
                  </div>
                 </section>
                <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                    {/* فوتر مؤقت حاليا  */}
                 {isAuthenticated ? <FooterHome /> : <Footer />}
                </section>
            </main>
         </div>
        </>
    );
}
export default HomePage;
