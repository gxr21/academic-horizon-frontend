import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useOrder } from "../../hooks/useOrders";
import { useChat } from "../../hooks/useChat";
import { ordersAPI, filesAPI, downloadOrderFile, reportsAPI, userAPI } from "../../lib/api";
import { getSocket } from "../../lib/socket";
import HeaderHome from "../../components/header/headerHome";
import FooterHome from "../../components/footer/footerHome";
import ProfilePopup from "../../components/popup/ProfilePopup";

const academicBlue = '#1A5276';
const OBJECT_ID_REGEX = /^[a-f\d]{24}$/i;
const MAX_UPLOAD_MB = 10;

const formatFileSize = (bytes) => {
    if (!bytes && bytes !== 0) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

function ChatPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const creatingOrderRef = useRef(false);
    const loadedRecipientRef = useRef(null);

    const [newMessage, setNewMessage] = useState('');
    const [orderDetails, setOrderDetails] = useState(null);
    const [selectedFile, setSelectedFile] = useState(null);
    const [orderStatus, setOrderStatus] = useState('pending');
    const [orderId, setOrderId] = useState(null);
    const [orderError, setOrderError] = useState(null);
    const [isProfilePopupOpen, setIsProfilePopupOpen] = useState(false);
    const [recipientId, setRecipientId] = useState(null);
    const [providerData, setProviderData] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState('');
    const [statusBusy, setStatusBusy] = useState(false);
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportReason, setReportReason] = useState('harassment');
    const [reportDetails, setReportDetails] = useState('');
    const [reportBusy, setReportBusy] = useState(false);
    const [reportError, setReportError] = useState('');
    const [existingReport, setExistingReport] = useState(null);

    const messagesEndRef = useRef(null);

    // Initialize E2EE chat hook
    const {
        messages,
        isConnected,
        isJoined,
        isLoading: chatLoading,
        error: chatError,
        typingUsers,
        sendMessage: sendEncryptedMessage,
        handleTyping,
        loadRecipientKey,
    } = useChat(orderId, user);

    // Order files (shown inside the conversation) — refreshed live through notifications / socket events
    const { data: orderFiles = [] } = useQuery({
        queryKey: ['orderFiles', orderId],
        queryFn: async () => (await filesAPI.getOrderFiles(orderId)).data?.files || [],
        enabled: !!orderId,
    });

    // Messages + files in one chronological timeline
    const timeline = [
        ...messages.map((m) => ({ kind: 'message', key: `m-${m.id}`, createdAt: m.createdAt, data: m })),
        ...orderFiles.map((f) => ({ kind: 'file', key: `f-${f.id}`, createdAt: f.createdAt, data: f })),
    ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    // Auto-scroll to bottom on new messages / files
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, orderFiles.length]);

    // Live: a file uploaded by the other participant shows up immediately
    useEffect(() => {
        const socket = getSocket();
        if (!socket || !orderId) return undefined;
        const onFileUploaded = (file) => {
            if (file?.orderId === orderId) {
                queryClient.invalidateQueries({ queryKey: ['orderFiles', orderId] });
            }
        };
        socket.on('file_uploaded', onFileUploaded);
        return () => socket.off('file_uploaded', onFileUploaded);
    }, [orderId, isConnected, queryClient]);

    // Resolve which order this chat is about (existing order, or create one from a service/package)
    useEffect(() => {
        const initChat = async () => {
            if (!isAuthenticated) {
                navigate('/login');
                return;
            }

            const searchOrderId = new URLSearchParams(location.search).get('orderId');
            let currentOrderId = location.state?.orderId || searchOrderId;

            // تجاهل أي معرف ليس ObjectId صالحاً (مثل معرفات مؤقتة قديمة)
            if (currentOrderId && !OBJECT_ID_REGEX.test(String(currentOrderId))) {
                console.warn('Ignoring invalid order id:', currentOrderId);
                currentOrderId = null;
                if (!location.state?.package) {
                    navigate('/dashboard', { replace: true });
                    return;
                }
            }

            if (currentOrderId) {
                setOrderError(null);
                setOrderId(currentOrderId);
                return;
            }

            if (location.state?.package) {
                // New order from a service/package selection — create via API
                // منع إنشاء الطلب مرتين (React StrictMode أو إعادة تشغيل الـ effect)
                if (creatingOrderRef.current) return;
                creatingOrderRef.current = true;
                setOrderError(null);
                const pkg = location.state.package;
                try {
                    const priceNumber =
                        typeof pkg.price === 'number'
                            ? pkg.price
                            : parseFloat(String(pkg.price ?? '').replace(/[^\d.]/g, '')) || 0;
                    const response = await ordersAPI.create(
                        pkg.serviceId
                            ? { serviceId: pkg.serviceId }
                            : {
                                  title: pkg.title,
                                  description: pkg.desc,
                                  serviceType: pkg.serviceType || 'general',
                                  price: priceNumber,
                              }
                    );
                    const newOrder = response.data?.order;
                    if (newOrder) {
                        setOrderId(newOrder.id);
                        queryClient.invalidateQueries({ queryKey: ['orders'] });
                        // استبدال الـ state بمعرف الطلب الحقيقي حتى لا يُنشأ طلب جديد عند تحديث الصفحة
                        navigate('/chat', { replace: true, state: { orderId: newOrder.id } });
                    }
                } catch (err) {
                    console.error('Failed to create order:', err);
                    setOrderError(err?.message || 'تعذر إنشاء الطلب');
                } finally {
                    creatingOrderRef.current = false;
                }
                return;
            }

            // Opened without an order (e.g. from the menu): jump to the latest relevant order
            try {
                if (user?.role === 'student') {
                    const res = await ordersAPI.getAll({ limit: 1 });
                    const latest = res.data?.[0];
                    if (latest) {
                        navigate('/chat', { replace: true, state: { orderId: latest.id } });
                        return;
                    }
                    setOrderError('لا توجد محادثات بعد. اطلب خدمة من صفحة الخدمات لتبدأ.');
                } else if (user?.role === 'provider') {
                    navigate('/dashboard', { replace: true });
                }
            } catch (err) {
                setOrderError(err?.message || 'تعذر تحميل المحادثات');
            }
        };

        initChat();
    }, [location.state, location.search, isAuthenticated, user, navigate, queryClient]);

    // Live order data (status, provider, ...) — refreshed whenever a notification arrives
    const { data: liveOrder, error: liveOrderError } = useOrder(orderId);

    useEffect(() => {
        if (!liveOrder) return;
        setOrderDetails(liveOrder);
        setOrderStatus(liveOrder.status);

        if (liveOrder.provider) {
            setProviderData((prev) => ({
                ...prev,
                name: liveOrder.provider.name,
                email: liveOrder.provider.email,
                phone: liveOrder.provider.phone || prev?.phone,
                bio: liveOrder.provider.bio || prev?.bio,
            }));
        }

        // Recipient for E2EE: the other participant (loaded again if a provider joins later)
        const otherId = user?.role === 'student' ? liveOrder.providerId : liveOrder.studentId;
        if (otherId && loadedRecipientRef.current !== otherId) {
            loadedRecipientRef.current = otherId;
            setRecipientId(otherId);
            loadRecipientKey(otherId);
            userAPI.getPublicProfile(otherId)
                .then((res) => {
                    const profile = res.data?.profile;
                    if (!profile) return;
                    setProviderData({
                        name: profile.name,
                        email: profile.email,
                        phone: profile.phone,
                        bio: profile.bio,
                        completedServices: profile.completedCount,
                        activeServices: profile.activeCount,
                    });
                })
                .catch(() => {});
        }
    }, [liveOrder, user?.role, loadRecipientKey]);

    useEffect(() => {
        if (liveOrderError && (liveOrderError.status === 403 || liveOrderError.status === 404)) {
            setOrderError('لا تملك صلاحية الوصول لهذا الطلب أو لم يعد موجوداً');
            setOrderId(null);
            setOrderDetails(null);
        }
    }, [liveOrderError]);

    // Send message / upload file handler
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!orderId || uploading) return;
        if (!newMessage.trim() && !selectedFile) return;

        if (selectedFile) {
            setUploading(true);
            setUploadError('');
            try {
                await filesAPI.upload(orderId, selectedFile);
                setSelectedFile(null);
                queryClient.invalidateQueries({ queryKey: ['orderFiles', orderId] });
            } catch (err) {
                console.error('File upload failed:', err);
                setUploadError(err.message || 'فشل رفع الملف');
                setUploading(false);
                return;
            }
            setUploading(false);
        }

        if (newMessage.trim()) {
            await sendEncryptedMessage(newMessage, recipientId);
            setNewMessage('');
        }
    };

    // Update order status via API
    const handleUpdateStatus = async (newStatus, confirmText) => {
        if (confirmText && !window.confirm(confirmText)) return;
        setStatusBusy(true);
        try {
            await ordersAPI.updateStatus(orderId, newStatus);
            setOrderStatus(newStatus);
            queryClient.invalidateQueries({ queryKey: ['orders'] });
        } catch (err) {
            console.error('Status update failed:', err);
            alert(err.message || 'تعذر تحديث حالة الطلب');
        } finally {
            setStatusBusy(false);
        }
    };

    const handleStartWork = () => handleUpdateStatus('in_progress');
    const handleCompleteOrder = () =>
        handleUpdateStatus(
            'completed',
            `هل أنت متأكد من إكمال الطلب ورفعه إلى الأدمن للتحقق؟${
                orderFiles.length === 0 ? '\n\nتنبيه: لم ترفع أي ملف في هذه المحادثة بعد.' : ''
            }`
        );
    const handleCancelOrder = () =>
        handleUpdateStatus('cancelled', 'هل أنت متأكد من إلغاء هذا الطلب؟ لا يمكن التراجع عن الإلغاء.');

    const handleFileSelect = (e) => {
        const file = e.target.files[0];
        e.target.value = ''; // allow choosing the same file again
        if (!file) return;
        setUploadError('');
        if (file.size > MAX_UPLOAD_MB * 1024 * 1024) {
            setUploadError(`حجم الملف أكبر من ${MAX_UPLOAD_MB} ميغابايت`);
            return;
        }
        setSelectedFile(file);
    };

    const handleDownloadFile = async (file) => {
        try {
            await downloadOrderFile(file);
        } catch (err) {
            alert(err.message || 'تعذر تحميل الملف');
        }
    };

    const handleRemoveFile = () => {
        setSelectedFile(null);
        setUploadError('');
    };

    useEffect(() => {
        if (!orderId || user?.role !== 'provider') {
            setExistingReport(null);
            return undefined;
        }
        let cancelled = false;
        reportsAPI.getForOrder(orderId)
            .then((res) => {
                if (!cancelled) setExistingReport(res.data?.report || null);
            })
            .catch(() => {
                if (!cancelled) setExistingReport(null);
            });
        return () => { cancelled = true; };
    }, [orderId, user?.role]);

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!orderId || reportBusy) return;
        setReportBusy(true);
        setReportError('');
        try {
            const res = await reportsAPI.create({
                orderId,
                reason: reportReason,
                details: reportDetails.trim(),
            });
            setExistingReport(res.data?.report || { status: 'pending' });
            setShowReportModal(false);
            setReportDetails('');
            alert('تم إرسال البلاغ إلى الإدارة. ستراجعه الإدارة وتتخذ الإجراء المناسب.');
        } catch (err) {
            setReportError(err.message || 'تعذر إرسال البلاغ');
        } finally {
            setReportBusy(false);
        }
    };

    const canReportStudent =
        user?.role === 'provider' &&
        orderId &&
        orderDetails?.studentId &&
        orderStatus !== 'pending';

    // Get display time from ISO date
    const formatTime = (isoDate) => {
        if (!isoDate) return '';
        return new Date(isoDate).toLocaleTimeString('ar-EG', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    return (
        <div className="font-tajawal bg-white min-h-screen" dir="rtl">
            <HeaderHome />

            <main className="container mx-auto px-6 py-8">
                {location.state?.justPurchased && (
                    <div className="mb-6 rounded-2xl border border-green-100 bg-green-50 px-5 py-4 text-green-800 text-sm font-bold leading-7">
                        تم شراء هذه الخدمة. سيُستقطع المبلغ المستحق من بطاقة ماستركارد الخاصة بك عند تنفيذ التحويل البنكي.
                    </div>
                )}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Order Details Panel */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6">
                            <h2 className="text-2xl font-bold text-academic-blue mb-4">تفاصيل الطلب</h2>

                            {orderDetails ? (
                                <div className="space-y-4">
                                    <div className="bg-gray-50 rounded-xl p-4">
                                        <h3 className="font-bold text-academic-blue text-lg">{orderDetails.title}</h3>
                                        <p className="text-gray-600 mt-2">{orderDetails.description}</p>
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <p className="text-academic-gold font-bold text-xl">
                                                {orderDetails.price ? `${orderDetails.price} دينار` : 'يُحدد بالتفاهم'}
                                            </p>
                                        </div>
                                    </div>

                                    {orderDetails.paymentStatus === 'reserved' && (
                                        <div className="rounded-xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 leading-7">
                                            تم شراء هذه الخدمة بماستركارد.
                                            سيُستقطع {orderDetails.price || 0} دينار من بطاقة الدفع الخاصة بالطالب عند تنفيذ التحويل البنكي.
                                        </div>
                                    )}

                                    <div className="bg-academic-blue/5 rounded-xl p-4">
                                        <h4 className="font-bold text-academic-blue mb-2">معلومات الطلب</h4>
                                        <div className="space-y-2 text-sm">
                                            <p><span className="font-bold">الحالة:</span>
                                                <span className={`mr-2 ${
                                                    orderStatus === 'pending' ? 'text-yellow-600' :
                                                    orderStatus === 'assigned' ? 'text-orange-600' :
                                                    orderStatus === 'in_progress' ? 'text-blue-600' :
                                                    orderStatus === 'completed' ? 'text-green-600' :
                                                    orderStatus === 'delivered' ? 'text-purple-600' :
                                                    'text-red-600'
                                                }`}>
                                                    {orderStatus === 'pending' ? 'بانتظار قبول مزود الخدمة' :
                                                     orderStatus === 'assigned' ? 'تم التعيين' :
                                                     orderStatus === 'in_progress' ? 'قيد التنفيذ' :
                                                     orderStatus === 'completed' ? 'بانتظار مراجعة الأدمن' :
                                                     orderStatus === 'delivered' ? 'تم التسليم' :
                                                     'ملغي'}
                                                </span>
                                            </p>
                                            <p><span className="font-bold">رقم الطلب:</span> #{orderId?.slice(-6)}</p>
                                            <p><span className="font-bold">التاريخ:</span> {new Date(orderDetails.createdAt || Date.now()).toLocaleDateString('ar-EG')}</p>
                                        </div>
                                    </div>

                                    {/* Connection Status */}
                                    <div className={`flex items-center gap-2 text-sm ${isConnected ? 'text-green-600' : 'text-red-500'}`}>
                                        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                                        {isConnected ? 'متصل بالدردشة المشفرة' : 'غير متصل'}
                                    </div>

                                    {/* E2EE Badge */}
                                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-lg p-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-4 text-green-600">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                        </svg>
                                        الرسائل مشفرة، ويمكن للإدارة مراجعتها لأغراض السلامة
                                    </div>

                                    {canReportStudent && (
                                        existingReport ? (
                                            <p className="text-sm text-orange-700 bg-orange-50 border border-orange-100 rounded-xl p-3">
                                                تم رفع بلاغ عن هذا الطالب إلى الإدارة
                                                {existingReport.status === 'pending' ? ' وهو قيد المراجعة.' : '.'}
                                            </p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setReportError('');
                                                    setShowReportModal(true);
                                                }}
                                                className="w-full bg-orange-50 text-orange-700 border border-orange-200 py-3 rounded-xl font-bold hover:bg-orange-600 hover:text-white transition-colors"
                                            >
                                                الإبلاغ عن الطالب المشاغب
                                            </button>
                                        )
                                    )}

                                    {/* Action Buttons */}
                                    {orderStatus === 'pending' && user?.role === 'student' && (
                                        <p className="text-sm text-yellow-700 bg-yellow-50 rounded-xl p-3">
                                            طلبك وصل لمزودي الخدمة وبانتظار قبول أحدهم. ستصلك إشعارات فور البدء.
                                        </p>
                                    )}

                                    {orderStatus === 'in_progress' && orderDetails.reviewNote && user?.role === 'provider' && (
                                        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-3 text-sm">
                                            <p className="font-bold mb-1">أعاد الأدمن الطلب للتعديل:</p>
                                            <p>{orderDetails.reviewNote}</p>
                                        </div>
                                    )}

                                    {orderStatus === 'assigned' && user?.role === 'provider' && (
                                        <button
                                            disabled={statusBusy}
                                            onClick={handleStartWork}
                                            className="w-full bg-blue-500 text-white py-3 rounded-xl font-bold hover:bg-blue-600 transition-colors disabled:opacity-50"
                                        >
                                            بدء التنفيذ
                                        </button>
                                    )}

                                    {orderStatus === 'in_progress' && user?.role === 'provider' && (
                                        <button
                                            disabled={statusBusy}
                                            onClick={handleCompleteOrder}
                                            className="w-full bg-green-500 text-white py-3 rounded-xl font-bold hover:bg-green-600 transition-colors disabled:opacity-50"
                                        >
                                            إكمال الطلب ورفعه للأدمن
                                        </button>
                                    )}

                                    {orderStatus === 'completed' && (
                                        <p className="text-sm text-green-700 bg-green-50 rounded-xl p-3">
                                            {user?.role === 'provider'
                                                ? 'تم رفع الطلب للأدمن وهو قيد المراجعة.'
                                                : 'أنهى المزود طلبك وهو الآن قيد مراجعة الإدارة قبل التسليم.'}
                                        </p>
                                    )}

                                    {orderStatus === 'delivered' && (
                                        <p className="text-sm text-purple-700 bg-purple-50 rounded-xl p-3">
                                            {user?.role === 'student'
                                                ? 'تم اعتماد وتسليم طلبك. يمكنك تحميل الملفات من المحادثة.'
                                                : 'تم اعتماد هذا الطلب من الأدمن.'}
                                        </p>
                                    )}

                                    {user?.role === 'student' &&
                                        ['pending', 'assigned', 'in_progress'].includes(orderStatus) && (
                                            <button
                                                disabled={statusBusy}
                                                onClick={handleCancelOrder}
                                                className="w-full bg-red-50 text-red-600 border border-red-200 py-3 rounded-xl font-bold hover:bg-red-600 hover:text-white transition-colors disabled:opacity-50"
                                            >
                                                إلغاء الطلب
                                            </button>
                                        )}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-academic-blue"></div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Chat Area */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 h-[600px] flex flex-col">
                            {/* Chat Header */}
                            <div className="bg-academic-blue text-white p-4 rounded-t-2xl">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
                                        </svg>
                                    </div>
                                    <div className="flex-1">
                                        <h3
                                            className={`font-bold ${(user?.role === 'student' || user?.role === 'admin') ? 'cursor-pointer hover:text-academic-gold' : ''} transition-colors`}
                                            onClick={() => (user?.role === 'student' || user?.role === 'admin') && setIsProfilePopupOpen(true)}
                                        >
                                            {user?.role === 'provider'
                                                ? orderDetails?.student?.name || 'الطالب'
                                                : providerData?.name || (user?.role === 'student' ? 'بانتظار مزود الخدمة' : 'مزود الخدمة')}
                                        </h3>
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm text-white/80">
                                                {isConnected && isJoined ? 'متصل الآن' : 'غير متصل'}
                                            </p>
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-3 text-green-400">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 1 0-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 0 0 2.25-2.25v-6.75a2.25 2.25 0 0 0-2.25-2.25H6.75a2.25 2.25 0 0 0-2.25 2.25v6.75a2.25 2.25 0 0 0 2.25 2.25Z" />
                                            </svg>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                {chatLoading && (
                                    <div className="flex items-center justify-center py-8">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-academic-blue"></div>
                                        <span className="mr-2 text-gray-500">جاري تحميل الرسائل...</span>
                                    </div>
                                )}

                                {orderError && !orderId && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                                        <p>{orderError}</p>
                                        <button
                                            type="button"
                                            onClick={() => navigate(user?.role === 'student' ? '/services' : '/dashboard')}
                                            className="mt-2 underline font-bold"
                                        >
                                            {user?.role === 'student' ? 'تصفح الخدمات' : 'العودة إلى لوحة التحكم'}
                                        </button>
                                    </div>
                                )}

                                {chatError && (
                                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-center text-sm">
                                        {chatError}
                                    </div>
                                )}

                                {!chatLoading && orderId && timeline.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-12 mb-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H8.25m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0H12m4.125 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 0 1-2.555-.337A5.972 5.972 0 0 1 5.41 20.97a5.969 5.969 0 0 1-.474-.065 4.48 4.48 0 0 0 .978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25Z" />
                                        </svg>
                                        <p>ابدأ المحادثة المشفرة</p>
                                    </div>
                                )}

                                {timeline.map((item) => {
                                    if (item.kind === 'file') {
                                        const file = item.data;
                                        const isOwnFile = file.uploaderId === user?.id;
                                        return (
                                            <div
                                                key={item.key}
                                                className={`flex ${isOwnFile ? 'justify-start' : 'justify-end'}`}
                                            >
                                                <div
                                                    className={`max-w-[70%] rounded-2xl p-4 ${
                                                        isOwnFile ? 'bg-academic-blue text-white' : 'bg-gray-100 text-gray-800'
                                                    }`}
                                                >
                                                    <button
                                                        type="button"
                                                        onClick={() => handleDownloadFile(file)}
                                                        className="flex items-center gap-3 text-right w-full"
                                                        title="اضغط لتحميل الملف"
                                                    >
                                                        <span className="text-2xl">📎</span>
                                                        <span className="flex-1 min-w-0">
                                                            <span className="block font-bold text-sm break-all">{file.originalName}</span>
                                                            <span className="block text-xs opacity-70">
                                                                {formatFileSize(file.size)} · اضغط للتحميل
                                                            </span>
                                                        </span>
                                                    </button>
                                                    <p className={`text-xs mt-2 ${isOwnFile ? 'text-white/70' : 'text-gray-500'}`}>
                                                        {file.uploader?.name && !isOwnFile ? `${file.uploader.name} · ` : ''}
                                                        {formatTime(file.createdAt)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }

                                    const message = item.data;
                                    return (
                                        <div
                                            key={item.key}
                                            className={`flex ${message.isOwn ? 'justify-start' : 'justify-end'}`}
                                        >
                                            <div
                                                className={`max-w-[70%] rounded-2xl p-4 ${
                                                    message.isOwn
                                                        ? 'bg-academic-blue text-white'
                                                        : message.messageType === 'system'
                                                        ? 'bg-academic-gold/20 text-academic-blue'
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}
                                            >
                                                <p>{message.text}</p>
                                                <p className={`text-xs mt-2 ${
                                                    message.isOwn ? 'text-white/70' : 'text-gray-500'
                                                }`}>
                                                    {formatTime(message.createdAt)}
                                                </p>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Typing Indicator */}
                                {typingUsers.length > 0 && (
                                    <div className="flex justify-end">
                                        <div className="bg-gray-100 rounded-2xl p-3 text-gray-500 text-sm">
                                            <div className="flex gap-1 items-center">
                                                <span>يكتب</span>
                                                <div className="flex gap-1">
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                                    <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                <div ref={messagesEndRef} />
                            </div>

                            {/* File Preview */}
                            {selectedFile && (
                                <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
                                    <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-gray-200">
                                        <div className="flex items-center gap-2">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5 text-academic-blue">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                            </svg>
                                            <span className="text-sm text-gray-700 break-all">
                                                {selectedFile.name}
                                                <span className="text-xs text-gray-400 mr-2">({formatFileSize(selectedFile.size)})</span>
                                                {uploading && <span className="text-xs text-academic-blue mr-2">جاري الرفع...</span>}
                                            </span>
                                        </div>
                                        <button onClick={handleRemoveFile} className="text-red-500 hover:text-red-700">
                                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-5">
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {uploadError && (
                                <div className="px-4 py-2 bg-red-50 text-red-600 text-sm border-t border-red-100">{uploadError}</div>
                            )}

                            {/* Message Input */}
                            <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-100">
                                <div className="flex gap-3">
                                    {/* File Upload */}
                                    <label className="cursor-pointer bg-gray-100 hover:bg-gray-200 text-academic-blue px-4 py-3 rounded-xl transition-colors flex items-center justify-center">
                                        <input
                                            type="file"
                                            onChange={handleFileSelect}
                                            className="hidden"
                                        />
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M18.375 12.739l-7.693 7.693a4.5 4.5 0 01-6.364-6.364l10.94-10.94A3 3 0 1119.5 7.372L8.552 18.32m.009-.01l-.01.01m5.699-9.941l-7.81 7.81a1.5 1.5 0 002.112 2.13" />
                                        </svg>
                                    </label>

                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => {
                                            setNewMessage(e.target.value);
                                            handleTyping();
                                        }}
                                        placeholder="اكتب رسالتك المشفرة هنا..."
                                        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 focus:outline-none focus:border-academic-blue"
                                        disabled={!isConnected || !orderId}
                                    />
                                    <button
                                        type="submit"
                                        className="bg-academic-blue text-white px-6 py-3 rounded-xl hover:bg-academic-blue-dark transition-colors disabled:opacity-50"
                                        disabled={!orderId || uploading || (!newMessage.trim() && !selectedFile) || (!selectedFile && !isConnected)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                                        </svg>
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <section className="bg-academic-blue py-16 text-white text-center rounded-t-[50px]" style={{ backgroundColor: academicBlue }}>
                <FooterHome />
            </section>

            {showReportModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" dir="rtl">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-academic-blue mb-1">الإبلاغ عن الطالب</h3>
                        <p className="text-sm text-gray-500 mb-4">
                            سيصل البلاغ إلى الإدارة مع اسم الطالب وطلب المحادثة. استخدم هذا فقط عند الإساءة أو الإخلال.
                        </p>
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">سبب البلاغ</label>
                                <select
                                    value={reportReason}
                                    onChange={(e) => setReportReason(e.target.value)}
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-academic-blue"
                                >
                                    <option value="harassment">إساءة أو تحرش</option>
                                    <option value="spam">رسائل مزعجة / سبام</option>
                                    <option value="inappropriate">محتوى غير لائق</option>
                                    <option value="fraud">احتيال أو تلاعب</option>
                                    <option value="other">سبب آخر</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 mb-1">التفاصيل</label>
                                <textarea
                                    value={reportDetails}
                                    onChange={(e) => setReportDetails(e.target.value)}
                                    rows={4}
                                    minLength={10}
                                    required
                                    placeholder="اشرح ماذا حدث (10 أحرف على الأقل)..."
                                    className="w-full border border-gray-200 rounded-xl px-3 py-2 focus:outline-none focus:border-academic-blue"
                                />
                            </div>
                            {reportError && (
                                <p className="text-sm text-red-600 bg-red-50 rounded-lg p-2">{reportError}</p>
                            )}
                            <div className="flex gap-3">
                                <button
                                    type="submit"
                                    disabled={reportBusy || reportDetails.trim().length < 10}
                                    className="flex-1 bg-orange-600 text-white py-2.5 rounded-xl font-bold hover:bg-orange-700 disabled:opacity-50"
                                >
                                    {reportBusy ? 'جاري الإرسال...' : 'إرسال البلاغ'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setShowReportModal(false)}
                                    className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl font-bold hover:bg-gray-200"
                                >
                                    إلغاء
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Profile Popup */}
            {providerData && (
                <ProfilePopup
                    isOpen={isProfilePopupOpen}
                    onClose={() => setIsProfilePopupOpen(false)}
                    userData={providerData}
                    userType="provider"
                />
            )}
        </div>
    );
}

export default ChatPage;
