import { useState, useEffect } from "react";
import PropTypes from "prop-types";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { useOrders, useAcceptOrder, useUpdateOrderStatus } from "../../hooks/useOrders";
import { walletAPI } from "../../lib/api";
import HeaderHome from "../../components/header/headerHome";
import FooterHome from "../../components/footer/footerHome";

const academicBlue = '#1A5276';

const STATUS_STYLES = {
    pending: { color: 'bg-yellow-100 text-yellow-800', text: 'بانتظار مزود' },
    assigned: { color: 'bg-orange-100 text-orange-800', text: 'تم التعيين' },
    in_progress: { color: 'bg-blue-100 text-blue-800', text: 'قيد التنفيذ' },
    completed: { color: 'bg-green-100 text-green-800', text: 'بانتظار مراجعة الأدمن' },
    delivered: { color: 'bg-purple-100 text-purple-800', text: 'تم الاعتماد والتسليم' },
    cancelled: { color: 'bg-red-100 text-red-800', text: 'ملغي' },
};

const getStatusColor = (status) => STATUS_STYLES[status]?.color || 'bg-gray-100 text-gray-800';
const getStatusText = (status) => STATUS_STYLES[status]?.text || status;
const formatPrice = (price) => (price > 0 ? `${price} دينار` : 'يُحدد بالتفاهم');
const formatDate = (iso) => (iso ? new Date(iso).toLocaleString('ar-EG') : '');

function StatBox({ label, value, tone }) {
    const tones = {
        gold: 'bg-amber-50 text-amber-700',
        blue: 'bg-blue-50 text-academic-blue',
        green: 'bg-green-50 text-green-700',
        purple: 'bg-purple-50 text-purple-700',
    };
    return (
        <div className={`${tones[tone]} rounded-2xl p-5 text-center shadow-sm`}>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-sm font-bold mt-1">{label}</p>
        </div>
    );
}

StatBox.propTypes = {
    label: PropTypes.string.isRequired,
    value: PropTypes.number.isRequired,
    tone: PropTypes.oneOf(['gold', 'blue', 'green', 'purple']).isRequired,
};

function ProviderDashboard() {
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    // Orders refresh instantly on notifications (see NotificationContext); the interval is a safety net.
    const { data: ordersData, isLoading } = useOrders({ limit: 100 }, { refetchInterval: 60000 });
    const { data: wallet } = useQuery({
        queryKey: ['providerWallet'],
        queryFn: async () => (await walletAPI.getMine()).data,
        enabled: user?.role === 'provider',
        refetchInterval: 60000,
    });
    const acceptMutation = useAcceptOrder();
    const statusMutation = useUpdateOrderStatus();

    const [activeTab, setActiveTab] = useState('incoming');
    const [selectedId, setSelectedId] = useState(null);
    const [actionError, setActionError] = useState('');

    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
            return;
        }
        if (user?.role !== 'provider') {
            navigate('/home');
        }
    }, [isAuthenticated, user, navigate]);

    const orders = ordersData?.orders || [];
    const incomingOrders = orders.filter((o) => o.status === 'pending' && !o.providerId);
    const myOrders = orders.filter((o) => o.providerId === user?.id);

    const visibleOrders = activeTab === 'incoming' ? incomingOrders : myOrders;
    const selectedOrder = orders.find((o) => o.id === selectedId) || null;
    const isMine = selectedOrder?.providerId === user?.id;

    const inProgressCount = myOrders.filter((o) => o.status === 'assigned' || o.status === 'in_progress').length;
    const awaitingCount = myOrders.filter((o) => o.status === 'completed').length;
    const deliveredCount = myOrders.filter((o) => o.status === 'delivered').length;

    const busy = acceptMutation.isPending || statusMutation.isPending;

    const run = async (fn) => {
        setActionError('');
        try {
            await fn();
        } catch (err) {
            setActionError(err.message || 'حدث خطأ، حاول مرة أخرى');
        }
    };

    const handleAccept = (order) =>
        run(async () => {
            await acceptMutation.mutateAsync(order.id);
            setActiveTab('mine');
            setSelectedId(order.id);
        });

    const handleStart = (order) =>
        run(() => statusMutation.mutateAsync({ orderId: order.id, status: 'in_progress' }));

    const handleSubmitToAdmin = (order) => {
        const warning = order.filesCount > 0
            ? ''
            : '\n\nتنبيه: لم ترفع أي ملف في محادثة هذا الطلب بعد.';
        if (!window.confirm(`هل أنت متأكد من إكمال الطلب "${order.title}" ورفعه إلى الأدمن للتحقق؟${warning}`)) {
            return;
        }
        run(() => statusMutation.mutateAsync({ orderId: order.id, status: 'completed' }));
    };

    const handleStartChat = (orderId) => {
        navigate('/chat', { state: { orderId } });
    };

    const selectOrder = (order) => {
        setSelectedId(order.id);
        setActionError('');
    };

    return (
        <div className="font-tajawal bg-white min-h-screen" dir="rtl">
            <HeaderHome />
            <main className="container mx-auto px-6 py-8">
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-academic-blue mb-2">لوحة تحكم مزود الخدمة</h1>
                    <p className="text-gray-600">مرحباً {user?.name}! هنا يمكنك استقبال الطلبات الواردة وتنفيذها ورفعها للأدمن</p>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
                    <StatBox label="طلبات واردة جديدة" value={incomingOrders.length} tone="gold" />
                    <StatBox label="قيد التنفيذ" value={inProgressCount} tone="blue" />
                    <StatBox label="بانتظار مراجعة الأدمن" value={awaitingCount} tone="green" />
                    <StatBox label="تم اعتمادها" value={deliveredCount} tone="purple" />
                    <button
                        type="button"
                        onClick={() => navigate('/wallet')}
                        className="bg-emerald-50 text-emerald-700 rounded-2xl p-5 text-center shadow-sm hover:bg-emerald-100 transition-colors"
                    >
                        <p className="text-2xl font-black">{Number(wallet?.balance || 0).toLocaleString('ar-IQ')}</p>
                        <p className="text-sm font-bold mt-1">رصيد المحفظة</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* قائمة الطلبات */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-xl">
                                <button
                                    onClick={() => setActiveTab('incoming')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        activeTab === 'incoming' ? 'bg-white text-academic-blue shadow' : 'text-gray-500'
                                    }`}
                                >
                                    الطلبات الواردة ({incomingOrders.length})
                                </button>
                                <button
                                    onClick={() => setActiveTab('mine')}
                                    className={`flex-1 py-2 rounded-lg text-sm font-bold transition-colors ${
                                        activeTab === 'mine' ? 'bg-white text-academic-blue shadow' : 'text-gray-500'
                                    }`}
                                >
                                    طلباتي ({myOrders.length})
                                </button>
                            </div>

                            {isLoading ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-academic-blue"></div>
                                    <span className="mr-2 text-gray-500">جاري التحميل...</span>
                                </div>
                            ) : visibleOrders.length > 0 ? (
                                <div className="space-y-4 max-h-[560px] overflow-y-auto">
                                    {visibleOrders.map((order) => (
                                        <div
                                            key={order.id}
                                            onClick={() => selectOrder(order)}
                                            className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                                                selectedId === order.id
                                                    ? 'border-academic-blue bg-academic-blue/5'
                                                    : 'border-gray-200 hover:border-academic-blue/50'
                                            }`}
                                        >
                                            <div className="flex justify-between items-start mb-2 gap-2">
                                                <h3 className="font-bold text-academic-blue">{order.title}</h3>
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold whitespace-nowrap ${getStatusColor(order.status)}`}>
                                                    {getStatusText(order.status)}
                                                </span>
                                            </div>
                                            {order.student?.name && (
                                                <p className="text-xs text-gray-500 mb-1">الطالب: {order.student.name}</p>
                                            )}
                                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">{order.description || order.service_type}</p>
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-academic-gold font-bold">{formatPrice(order.price)}</span>
                                                <span className="text-gray-500">{order.messagesCount || 0} رسالة</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-10">
                                    <p className="text-gray-500">
                                        {activeTab === 'incoming'
                                            ? 'لا توجد طلبات واردة حالياً. ستصلك إشعارات فور ورود طلب جديد.'
                                            : 'لم تقبل أي طلب بعد'}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* تفاصيل الطلب المحدد */}
                    <div className="lg:col-span-2">
                        {selectedOrder ? (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                                <div className="flex justify-between items-start mb-6 gap-4">
                                    <div>
                                        <h2 className="text-2xl font-bold text-academic-blue mb-2">{selectedOrder.title}</h2>
                                        <p className="text-gray-600 whitespace-pre-line">{selectedOrder.description || 'لا يوجد وصف'}</p>
                                    </div>
                                    <span className={`px-3 py-1 rounded-full text-sm font-bold whitespace-nowrap ${getStatusColor(selectedOrder.status)}`}>
                                        {getStatusText(selectedOrder.status)}
                                    </span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-bold text-academic-blue mb-2">معلومات الطلب</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-bold">رقم الطلب:</span> #{selectedOrder.id?.slice(-6)}</p>
                                            <p><span className="font-bold">الطالب:</span> {selectedOrder.student?.name || '—'}</p>
                                            <p><span className="font-bold">السعر:</span> <span className="text-academic-gold font-bold">{formatPrice(selectedOrder.price)}</span></p>
                                            {selectedOrder.paymentStatus === 'reserved' && (
                                                <p className="text-amber-700 font-bold">تم استلام مبلغ الطلب من الطالب وتأكيده من الإدارة</p>
                                            )}
                                            <p><span className="font-bold">تاريخ الطلب:</span> {formatDate(selectedOrder.createdAt)}</p>
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h4 className="font-bold text-academic-blue mb-2">النشاط</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-bold">الرسائل:</span> {selectedOrder.messagesCount || 0}</p>
                                            <p><span className="font-bold">الملفات المرفوعة:</span> {selectedOrder.filesCount || 0}</p>
                                            <p className="text-gray-600">
                                                {selectedOrder.lastMessageAt
                                                    ? `آخر نشاط: ${formatDate(selectedOrder.lastMessageAt)}`
                                                    : 'لا توجد رسائل بعد'}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {selectedOrder.status === 'in_progress' && selectedOrder.reviewNote && isMine && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 mb-6 text-sm">
                                        <p className="font-bold mb-1">أعاد الأدمن الطلب للتعديل:</p>
                                        <p>{selectedOrder.reviewNote}</p>
                                    </div>
                                )}

                                {actionError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4">{actionError}</div>
                                )}

                                <div className="flex flex-wrap gap-4">
                                    {/* طلب وارد جديد */}
                                    {selectedOrder.status === 'pending' && !selectedOrder.providerId && (
                                        <button
                                            disabled={busy}
                                            onClick={() => handleAccept(selectedOrder)}
                                            className="flex-1 min-w-[180px] bg-academic-blue text-white py-3 rounded-xl font-bold hover:bg-academic-blue-dark transition-colors disabled:opacity-50"
                                        >
                                            {acceptMutation.isPending ? 'جاري القبول...' : 'قبول الطلب'}
                                        </button>
                                    )}

                                    {/* طلباتي */}
                                    {isMine && (
                                        <button
                                            onClick={() => handleStartChat(selectedOrder.id)}
                                            className="flex-1 min-w-[180px] bg-academic-blue text-white py-3 rounded-xl font-bold hover:bg-academic-blue-dark transition-colors"
                                        >
                                            فتح المحادثة ورفع الملفات
                                        </button>
                                    )}

                                    {isMine && selectedOrder.status === 'assigned' && (
                                        <button
                                            disabled={busy}
                                            onClick={() => handleStart(selectedOrder)}
                                            className="flex-1 min-w-[180px] bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                                        >
                                            بدء التنفيذ
                                        </button>
                                    )}

                                    {isMine && selectedOrder.status === 'in_progress' && (
                                        <button
                                            disabled={busy}
                                            onClick={() => handleSubmitToAdmin(selectedOrder)}
                                            className="flex-1 min-w-[180px] bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                                        >
                                            {statusMutation.isPending ? 'جاري الرفع...' : 'إكمال الطلب ورفعه للأدمن'}
                                        </button>
                                    )}
                                </div>

                                {isMine && selectedOrder.status === 'completed' && (
                                    <p className="mt-4 text-sm text-green-700 bg-green-50 rounded-xl p-3">
                                        تم رفع الطلب للأدمن وهو الآن قيد المراجعة. ستصلك إشعارات عند اعتماده أو إعادته للتعديل.
                                    </p>
                                )}
                                {isMine && selectedOrder.status === 'delivered' && (
                                    <p className="mt-4 text-sm text-purple-700 bg-purple-50 rounded-xl p-3">
                                        اعتمد الأدمن هذا الطلب وتم تسليمه للطالب.
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 flex items-center justify-center h-full min-h-[300px]">
                                <div className="text-center">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-16 text-gray-400 mx-auto mb-4">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z" />
                                    </svg>
                                    <p className="text-gray-500">اختر طلباً لعرض التفاصيل</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </main>
            <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px] mt-16" style={{ backgroundColor: academicBlue }}>
                <FooterHome />
            </section>
        </div>
    );
}

export default ProviderDashboard;
