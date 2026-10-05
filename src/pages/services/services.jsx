import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Header from "../../components/header/header";
import HeaderHome from "../../components/header/headerHome";
import { useAuth } from "../../context/AuthContext";
import Footer from "../../components/footer/footer";
import FooterHome from "../../components/footer/footerHome";
import ClickSpark from "../../components/animate/clicker";
import PurchaseCheckout from "../../components/purchase/PurchaseCheckout";
import { servicesAPI } from "../../lib/api";

const academicBlue = '#1A5276';
const img_academic = 'assets/Academic workspace with laptop and books.png'

function ServicesPage () {
    const navigate = useNavigate();
    const { isAuthenticated, user } = useAuth();
    const [checkoutService, setCheckoutService] = useState(null);

    // Services published by the admin (refreshed automatically when a "new service" notification arrives)
    const { data: services = [], isLoading, isError } = useQuery({
        queryKey: ['services'],
        queryFn: async () => (await servicesAPI.getAll()).data?.services || [],
    });

    const handleOrderService = (service) => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'student') {
            alert('طلب الخدمات متاح للطلاب فقط');
            return;
        }
        setCheckoutService({
            serviceId: service.id,
            title: service.title,
            desc: service.description,
            price: service.price,
            serviceType: service.serviceType,
        });
    };

    return (
     <div className="font-tajawal bg-white min-h-screen" dir="rtl">
                {isAuthenticated ? <HeaderHome /> : <Header />}
                {/* === المحتوى الرئيسي === */}
            <main className="mian-content" dir="rtl">
                <section className="relative py-20 overflow-hidden bg-gray-50 flex flex-row ">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-academic-blue/5 rounded-l-full -z-10"></div>
                    <div className="container mx-auto px-6 flex flex-col items-start text-right">
                        <h1 className="text-5xl md:text-6xl font-extrabold text-academic-blue mb-6 leading-tight " style={{ color: academicBlue }}>خدماتنا التعليمية <br/>المتكاملة</h1>
                        <p className="text-xl text-gray-600 max-w-2xl mb-10 leading-relaxed">نقدم حلولا احترافية خصيصا للطلاب و الباحثين , نجمع بين الدقة العلمية <br/> و الجمالية الأبداعية لمساعدتكم في تحقق أعلى المراتب العلمية</p>
                    </div>
                    <div className="flex flex-col gap-4">
                        <div className="w-full h-full rounded-lg">
                            <img src={img_academic} alt="photo" className="rounded-lg max-w-screen-2xl"/>
                        </div>
                    </div>
                </section>
                <section className="relative py-20 overflow-hidden bg-gray-200">
                    <div className="text-center mb-16">
                        <h1 className="text-academic-blue text-5xl">مجالات تخصنا</h1>
                        <div className="w-40 h-1 bg-academic-gold mx-auto rounded-full mt-4"></div>
                    </div>
                </section>
                <section className="py-24 container mx-auto px-6 ">
                    {isLoading && (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-academic-blue"></div>
                            <span className="mr-3 text-gray-500">جاري تحميل الخدمات...</span>
                        </div>
                    )}

                    {isError && (
                        <p className="text-center text-red-500 py-12">تعذر تحميل الخدمات، حاول مرة أخرى لاحقاً</p>
                    )}

                    {!isLoading && !isError && services.length === 0 && (
                        <p className="text-center text-gray-500 py-12">لا توجد خدمات متاحة حالياً</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {services.map((service) => (
                            <div
                                key={service.id}
                                className="bg-white rounded-3xl border border-gray-100 shadow-xl hover:shadow-2xl transition-all border-b-4 border-b-academic-gold border-r-academic-gold border-r-4 overflow-hidden flex flex-col"
                            >
                                <ClickSpark sparkColor="#E9C176">
                                    <div className="p-8 flex flex-col h-full">
                                        <h3 className="text-2xl font-bold text-academic-blue mb-4">{service.title}</h3>
                                        <p className="text-gray-500 leading-relaxed mb-6 flex-1 whitespace-pre-line">
                                            {service.description || 'خدمة أكاديمية احترافية'}
                                        </p>
                                        <p className="text-academic-gold font-black text-2xl mb-6">
                                            {service.price > 0 ? `${service.price} دينار` : 'السعر بالتفاهم'}
                                        </p>
                                        <button
                                            type="button"
                                            onClick={() => handleOrderService(service)}
                                            className="w-full bg-academic-blue text-white font-bold py-3 px-6 rounded-xl hover:bg-academic-blue-dark transition-all duration-300 active:scale-95 shadow-md hover:shadow-lg"
                                        >
                                            اطلب الخدمة الآن
                                        </button>
                                    </div>
                                </ClickSpark>
                            </div>
                        ))}
                    </div>
                </section>
                <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                    {isAuthenticated ? <FooterHome /> : <Footer />}
                </section>
            </main>
            {checkoutService && (
                <PurchaseCheckout
                    service={checkoutService}
                    onClose={() => setCheckoutService(null)}
                />
            )}
        </div>
            
    );
}
export default ServicesPage;
