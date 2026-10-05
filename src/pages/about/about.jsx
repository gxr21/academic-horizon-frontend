// eslint-disable next-line no-unused-vars
import { ServiceCard } from "../../components/crads/cards.jsx";
import Footer from "../../components/footer/footer.jsx";
import FooterHome from "../../components/footer/footerHome.jsx";
import Header from "../../components/header/header.jsx";
import HeaderHome from "../../components/header/headerHome.jsx";
import { useAuth } from "../../context/AuthContext";
import ClickSpark from "../../components/animate/clicker.jsx";
const academicBlue = '#1A5276';
const img_comm = '/assets/img_communcate.png'
function AboutPage () {
    const { isAuthenticated } = useAuth();
    
    return (
        <div className="font-tajawal bg-white min-h-screen" dir="rtl">
             {isAuthenticated ? <HeaderHome /> : <Header />}
             {/* === المحتوى الرئيسي === */}
             <main className="mian-content" dir="rtl">
                <section className="relative py-20 overflow-hidden bg-gray-50">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-academic-blue/5 rounded-l-full -z-10"></div>
                    <div className="container mx-auto px-6 flex flex-col items-center text-center">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight" style={{ color: academicBlue }}> من نحن</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed ">بوابة التميز الأكاديمي التي تدمج بين التقاليد البحثية و احدث التقنيات الرقمية <br/>لنرسم معا افاقا جديدة للمعرفة الانسانية </p>
                    </div>
                </section>
                <section className="py-24 container mx-auto px-6 flex flex-row gap-40">
                    <div className="flex flex-col gap-10">
                        <h1 className="text-5xl md:text-4xl font-extrabold text-academic-blue mb-6 leading-tight">قصتنا</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed ">
                            بدأت رحلة Academic Horizon من فكرة بسيطة ولكنها طموحة: سد الفجوة
                             بين تطلعات الباحثين الشباب والمعايير الأكاديمية العالمية. لاحظنا الصعوبات
                             التي يواجهها الطلاب في الوصول إلى مصادر موثوقة وفي تنظيم أفكارهم البحثية
                             بطريقة منهجية.
                        </p>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed ">
                            ومن هنا، اجتمع نخبة من الأكاديميين والمستشارين لتأسيس منصة توفر الدعم،
                            والإرشاد، والأدوات اللازمة لكل طالب علم. نحن لسنا مجرد مزود خدمة، بل نحن
                            شركاء في رحلة البحث عن المعرفة، نؤمن بأن كل طالب يمتلك القدرة على التغيير
                            إذا ما توفرت له الأدوات الصحيحة.
                        </p>
                    </div>
                  <div className="flex flex-col gap-4 ">
                    <div className="bg-academic-blue w-full h-full rounded-lg">
                        <img src={img_comm} alt="photo" className="rounded-lg"/>
                    </div>
                </div>   
                </section>
                <section className="py-24 container mx-auto px-6 ">
                    <div className="text-center mb-16">
                        <h2 className="text-3xl font-bold text-academic-blue mb-4">رسالتنا</h2>
                        <div className="w-20 h-1 bg-academic-gold mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <ServiceCard
                        title = 'رؤيتنا'
                        desc = 'أن نكون المنصة الرائدة عالمياً في تمكين البحث الأكاديمي، محولين التحديات التعليمية إلى فرص للإبداع والابتكار والنمو المعرفي المستدام.'
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>}  
                        animate={ClickSpark}   
                        />
                        <ServiceCard
                         title= 'رسالتنا'
                        desc= 'توفير بيئة أكاديمية متكاملة تدعم الطلاب والباحثين بأدوات احترافية واستشارات دقيقة، مع الالتزام بأعلى معاييرالجودة والأمانة العلمية .'
                        icon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41m5.96 5.96a14.926 14.926 0 0 1-5.841 2.58m-.119-8.54a6 6 0 0 0-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 0 0-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312m-2.24 2.39a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
                        </svg>
                        }
                        animate={ClickSpark}
                        />
                    </div>
                </section>
                <section className="py-24 container mx-auto px-6">
                        <h2 className="text-3xl font-bold text-center mb-12 text-academic-blue">قيمنا الراسخة</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-20">
                            <div className="flex flex-col justify-center items-center">
                                <div className="bg-gray-300 w-[80px] p-6 rounded-lg shadow-md flex justify-center items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.7} stroke="currentColor" className="size-10 text-academic-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.57-.598-3.75h-.152c-3.196 0-6.1-1.25-8.25-3.286Zm0 13.036h.008v.008H12v-.008Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <h3 className="text-xl font-semibold mb-4 text-academic-blue">الأمانة الأكاديمية</h3>
                                <p className="text-gray-600 text-center">نحن نحرص على تقديم أفضل الخدمات التعليمية مع التركيز على الجودة والابتكار.</p>
                            </div>
                        </div>
                            <div className="flex flex-col justify-center items-center">
                                <div className="bg-gray-300 w-[80px] p-6 rounded-lg shadow-md flex justify-center items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <h3 className="text-xl font-semibold mb-4 text-academic-blue">الجودة</h3>
                                <p className="text-gray-600 text-center">
                                    التميز هو معيارنا الوحيد؛ نقدم مخرجات بحثية تتوافق مع أرقى
                                    المقاييس العالمية.
                                </p>
                            </div>
                        </div>
                            <div className="flex flex-col justify-center items-center">
                                <div className="bg-gray-300 w-[80px] p-6 rounded-lg shadow-md flex justify-center items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-10 text-academic-blue">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
                                </svg>
                            </div>
                            <div className="flex flex-col justify-center items-center">
                                <h3 className="text-xl font-semibold mb-4 text-academic-blue">الالتزام</h3>
                                <p className="text-gray-600 text-center">
                                  نحن ملتزمون بنجاحك، ونبقى معك خطوة بخطوة حتى بلوغ غايتك
                                    الأكاديمية. 
                                </p>
                            </div>
                        </div>
                    </div>
                </section>
                <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                    {isAuthenticated ? <FooterHome /> : <Footer />}
                </section>
             </main>
        </div>
    )
}
export default AboutPage;
