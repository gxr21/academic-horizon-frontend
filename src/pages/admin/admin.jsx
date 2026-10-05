import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
  FaUsers,
  FaCheckCircle,
  FaPlus,
  FaChartBar,
  FaSignOutAlt,
  FaComments,
  FaUserTie,
  FaTrash,
  FaClipboardCheck,
  FaPaperclip,
  FaUndo,
  FaDownload,
  FaToggleOn,
  FaToggleOff,
  FaUserPlus,
  FaFlag,
  FaBan,
  FaUnlock,
  FaIdCard,
  FaEdit,
  FaWallet,
  FaCreditCard,
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '../../context/AuthContext';
import { adminAPI, servicesAPI, filesAPI, downloadOrderFile, profileChangesAPI } from '../../lib/api';
import NotificationBell from '../../components/notifications/NotificationBell';
import { getStoredPrivateKey, decryptMessage } from '../../lib/crypto';

const academicBlue = '#1A5276';

// Data is refreshed instantly by real-time notifications (see NotificationContext);
// this slow interval is only a safety net.
const SAFETY_REFRESH_MS = 60 * 1000;

const STATUS_META = {
  pending: { text: 'بانتظار مزود', className: 'bg-yellow-100 text-yellow-800' },
  assigned: { text: 'تم التعيين', className: 'bg-orange-100 text-orange-800' },
  in_progress: { text: 'قيد التنفيذ', className: 'bg-blue-100 text-blue-800' },
  completed: { text: 'بانتظار المراجعة', className: 'bg-green-100 text-green-700' },
  delivered: { text: 'معتمد ومسلّم', className: 'bg-purple-100 text-purple-700' },
  cancelled: { text: 'ملغي', className: 'bg-red-100 text-red-700' },
};
const getStatusText = (status) => STATUS_META[status]?.text || status;
const getStatusClass = (status) => STATUS_META[status]?.className || 'bg-gray-100 text-gray-800';
const formatDate = (iso) => (iso ? new Date(iso).toLocaleDateString('ar-EG') : '—');
const formatDateTime = (iso) => (iso ? new Date(iso).toLocaleString('ar-EG') : '—');

const REPORT_REASON_LABEL = {
  harassment: 'إساءة أو تحرش',
  spam: 'رسائل مزعجة',
  inappropriate: 'محتوى غير لائق',
  fraud: 'احتيال أو تلاعب',
  other: 'سبب آخر',
};
const REPORT_STATUS_META = {
  pending: { text: 'قيد المراجعة', className: 'bg-orange-100 text-orange-800' },
  reviewed: { text: 'تمت المراجعة', className: 'bg-blue-100 text-blue-800' },
  dismissed: { text: 'مرفوض', className: 'bg-gray-100 text-gray-700' },
  actioned: { text: 'تم اتخاذ إجراء', className: 'bg-red-100 text-red-700' },
};

const restrictionBadge = (user) => {
  if (user?.restrictionType === 'permanent') {
    return { text: 'محظور نهائياً', className: 'bg-red-100 text-red-700' };
  }
  if (user?.restrictionType === 'temporary' && user.restrictionUntil && new Date(user.restrictionUntil) > new Date()) {
    return { text: `مقيّد حتى ${formatDate(user.restrictionUntil)}`, className: 'bg-orange-100 text-orange-800' };
  }
  return null;
};
const formatSize = (bytes) => {
  if (!bytes && bytes !== 0) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [showProviderForm, setShowProviderForm] = useState(false);
  const [viewingOrderId, setViewingOrderId] = useState(null);
  const [restrictTarget, setRestrictTarget] = useState(null);
  const [editProvider, setEditProvider] = useState(null);
  const isAdmin = isAuthenticated && user?.role === 'admin';

  // ─── Fetch real data via API ───────────────────────────────────────
  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: async () => (await adminAPI.getStats()).data,
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: async () => (await adminAPI.getUsers({ limit: 500 })).data || [],
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  // Orders finished by providers: waiting for review (completed) + approved (delivered)
  const { data: finishedOrders = [] } = useQuery({
    queryKey: ['adminOrders', 'finished'],
    queryFn: async () =>
      (await adminAPI.getAllOrders({ limit: 200, status: 'completed,delivered' })).data || [],
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const { data: conversations = [] } = useQuery({
    queryKey: ['adminConversations'],
    queryFn: async () => (await adminAPI.getConversations()).data || [],
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['adminServices'],
    queryFn: async () => (await servicesAPI.getAllAdmin()).data?.services || [],
    enabled: isAdmin,
  });

  const { data: reports = [] } = useQuery({
    queryKey: ['adminReports'],
    queryFn: async () => (await adminAPI.getReports({ limit: 200 })).data || [],
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const { data: profileChanges = [] } = useQuery({
    queryKey: ['adminProfileChanges'],
    queryFn: async () => (await adminAPI.getProfileChanges({ limit: 200 })).data || [],
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const { data: finance } = useQuery({
    queryKey: ['adminFinance'],
    queryFn: async () => (await adminAPI.getFinance()).data,
    enabled: isAdmin,
    refetchInterval: SAFETY_REFRESH_MS,
  });

  const [commissionInput, setCommissionInput] = useState('');
  const [revealedCard, setRevealedCard] = useState(null);

  const providers = users.filter((u) => u.role === 'provider');
  const students = users.filter((u) => u.role === 'student');
  const awaitingOrders = finishedOrders.filter((o) => o.status === 'completed');

  // Counters come from the server (accurate even beyond the list limits)
  const studentsCount = stats?.students ?? students.length;
  const providersCount = stats?.providers ?? providers.length;
  const completedCount = stats?.completedOrders ?? finishedOrders.length;
  const awaitingCount = stats?.awaitingReview ?? awaitingOrders.length;
  const pendingReports = reports.filter((r) => r.status === 'pending');
  const pendingReportsCount = stats?.pendingReports ?? pendingReports.length;
  const pendingProfileChanges = profileChanges.filter((r) => r.status === 'pending');
  const pendingProfileChangesCount = stats?.pendingProfileChanges ?? pendingProfileChanges.length;
  const pendingWithdrawalsCount = stats?.pendingWithdrawals ?? finance?.pendingWithdrawals ?? 0;
  const platformBalance = stats?.platformBalance ?? finance?.platformBalance ?? 0;
  const commissionPercent = finance?.commissionPercent ?? stats?.commissionPercent ?? 15;

  // Redirect if not admin
  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'admin') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  const refreshAll = () => {
    ['adminStats', 'adminUsers', 'adminOrders', 'adminConversations', 'adminServices', 'adminReports', 'adminProfileChanges', 'adminFinance'].forEach((key) =>
      queryClient.invalidateQueries({ queryKey: [key] })
    );
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleNotificationSelect = (notification) => {
    if (notification.type === 'order_submitted') setActiveTab('completed');
    else if (notification.type === 'student_report') setActiveTab('reports');
    else if (notification.type === 'provider_profile_change') setActiveTab('profileChanges');
    else if (notification.type === 'withdrawal_requested') setActiveTab('finance');
    else if (notification.type === 'new_user') {
      setActiveTab(notification.title?.includes('مزود') ? 'providers' : 'students');
    } else if (notification.orderId) setActiveTab('conversations');
  };

  const runAction = async (fn, errorMessage) => {
    try {
      await fn();
      refreshAll();
      return true;
    } catch (err) {
      console.error(errorMessage, err);
      alert(err?.message || errorMessage);
      return false;
    }
  };

  const handleDeleteUser = (userId, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟ سيتم حذف جميع طلباته ورسائله.`)) return;
    runAction(() => adminAPI.deleteUser(userId), 'فشل حذف المستخدم');
  };

  const handleDeleteOrder = (orderId, title) => {
    if (
      !window.confirm(
        `هل أنت متأكد من حذف الطلب "${title || '#' + orderId?.slice(-6)}"؟\nسيتم حذف جميع رسائله وملفاته نهائياً ولا يمكن التراجع.`
      )
    ) {
      return;
    }
    runAction(() => adminAPI.deleteOrder(orderId), 'فشل حذف الطلب');
  };

  const handleApprove = (order) => {
    const price = Number(order.price || 0);
    const rate = Number(order.commissionRate ?? commissionPercent);
    const commission = Number(order.commissionAmount || Math.round((price * rate) / 100));
    const providerShare = Number(order.providerAmount || (price - commission));
    if (!window.confirm(
      `اعتماد الطلب "${order.title}" وتسليمه للطالب؟\nالسعر ${price} دينار · للمزود ${providerShare} · عمولتك ${commission}`
    )) return;
    runAction(() => adminAPI.reviewOrder(order.id, 'delivered'), 'فشل اعتماد الطلب');
  };

  const handleSaveCommission = () => {
    const next = Number(commissionInput || commissionPercent);
    if (!Number.isFinite(next) || next < 0 || next > 100) {
      alert('نسبة العمولة بين 0 و 100');
      return;
    }
    runAction(() => adminAPI.updateCommission(next), 'فشل تحديث العمولة');
  };

  const handleRevealCard = async (withdrawal) => {
    try {
      const res = await adminAPI.revealWithdrawalCard(withdrawal.id);
      setRevealedCard(res.data);
    } catch (err) {
      alert(err.message || 'تعذر عرض رقم البطاقة');
    }
  };

  const handleReviewWithdrawal = (withdrawal, status) => {
    const note =
      status === 'rejected'
        ? window.prompt('سبب الرفض (سيُعاد المبلغ لمحفظة المزود):', '')
        : '';
    if (status === 'rejected' && note === null) return;
    if (status === 'paid' && !window.confirm(`تأكيد تحويل ${withdrawal.amount} دينار إلى ماستركارد ****${withdrawal.cardLast4}؟`)) {
      return;
    }
    runAction(
      () => adminAPI.reviewWithdrawal(withdrawal.id, { status, adminNote: note || '' }),
      'فشل تحديث طلب السحب'
    );
    setRevealedCard(null);
  };

  const handleReturn = (order) => {
    const note = window.prompt(`سبب إرجاع الطلب "${order.title}" للمزود (اختياري):`, '');
    if (note === null) return; // cancelled
    runAction(() => adminAPI.reviewOrder(order.id, 'in_progress', note.trim()), 'فشل إرجاع الطلب');
  };

  const handleCreateService = (form) =>
    runAction(
      () =>
        servicesAPI.create({
          title: form.title,
          description: form.description,
          price: Number(form.price) || 0,
        }),
      'فشل إضافة الخدمة'
    );

  const handleToggleService = (service) =>
    runAction(() => servicesAPI.update(service.id, { isActive: !service.isActive }), 'فشل تحديث الخدمة');

  const handleDeleteService = (service) => {
    if (!window.confirm(`حذف الخدمة "${service.title}" نهائياً؟`)) return;
    runAction(() => servicesAPI.remove(service.id), 'فشل حذف الخدمة');
  };

  const handleCreateProvider = async (form) => {
    try {
      const res = await adminAPI.createProvider(form);
      refreshAll();
      setShowProviderForm(false);
      alert(res.message || (res.data?.emailSent
        ? 'تم إنشاء المزود وإرسال رسالة الترحيب إلى بريده'
        : 'تم إنشاء المزود'));
      return true;
    } catch (err) {
      alert(err?.message || 'فشل إضافة مزود الخدمة');
      return false;
    }
  };

  const handleUpdateProvider = async (payload) => {
    if (!editProvider?.id) return false;
    const ok = await runAction(() => adminAPI.updateUser(editProvider.id, payload), 'فشل تحديث بيانات المزود');
    if (ok) setEditProvider(null);
    return ok;
  };

  const handleReviewProfileChange = (request, status) => {
    const note =
      status === 'rejected'
        ? window.prompt('سبب الرفض (اختياري):', '')
        : '';
    if (status === 'rejected' && note === null) return;
    runAction(
      () => adminAPI.reviewProfileChange(request.id, { status, adminNote: note || '' }),
      'فشل تحديث طلب التغيير'
    );
  };

  const handleDownloadChangeDoc = async (request, index, name) => {
    try {
      const blob = await profileChangesAPI.downloadDocument(request.id, index);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = name || 'document';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert(err.message || 'تعذر تحميل المستمسك');
    }
  };

  const handleRestrictStudent = async (payload) => {
    if (!restrictTarget?.id) return false;
    const ok = await runAction(
      () =>
        adminAPI.restrictUser(restrictTarget.id, {
          ...payload,
          reportId: restrictTarget.reportId,
        }),
      'فشل تقييد الحساب'
    );
    if (ok) setRestrictTarget(null);
    return ok;
  };

  const handleUnrestrictStudent = (student) => {
    if (!window.confirm(`فك التقييد عن "${student.name}"؟`)) return;
    runAction(() => adminAPI.unrestrictUser(student.id), 'فشل فك التقييد');
  };

  const handleDismissReport = (report) => {
    if (!window.confirm('رفض هذا البلاغ دون تقييد الطالب؟')) return;
    runAction(
      () => adminAPI.reviewReport(report.id, { status: 'dismissed' }),
      'فشل تحديث البلاغ'
    );
  };

  // Table of orders finished by providers (used by the overview + "completed" tab)
  const renderOrdersTable = (orders, { compact = false } = {}) => (
    <table className="w-full text-right border-separate border-spacing-y-3">
      <thead>
        <tr className="text-gray-400 text-xs font-bold uppercase">
          <th className="px-4 pb-2">رقم الطلب</th>
          <th className="px-4 pb-2">الخدمة</th>
          {!compact && <th className="px-4 pb-2">الطالب</th>}
          <th className="px-4 pb-2">المزود</th>
          {!compact && <th className="px-4 pb-2">التوزيع</th>}
          <th className="px-4 pb-2">الحالة</th>
          <th className="px-4 pb-2 text-center">الملفات</th>
          <th className="px-4 pb-2 text-center">إجراءات</th>
        </tr>
      </thead>
      <tbody>
        {orders.map((order) => (
          <OrderRow
            key={order.id}
            order={order}
            compact={compact}
            expanded={expandedOrderId === order.id}
            onToggleFiles={() => setExpandedOrderId(expandedOrderId === order.id ? null : order.id)}
            onApprove={() => handleApprove(order)}
            onReturn={() => handleReturn(order)}
            onDelete={() => handleDeleteOrder(order.id, order.title)}
          />
        ))}
      </tbody>
    </table>
  );

  return (
    <div className="h-screen flex bg-gray-100 font-tajawal overflow-hidden" dir="rtl">
      {/* 1. السايد بار الجانبي */}
      <aside className="w-64 flex flex-col shadow-2xl z-10 text-white" style={{ backgroundColor: academicBlue }}>
        <div className="p-8 text-center border-b border-white/10">
          <h1 className="text-xl font-black">لوحة المسؤول</h1>
          <p className="text-[10px] text-blue-200 uppercase tracking-widest mt-1">الأفق الأكاديمي</p>
        </div>
        <nav className="flex-1 p-4 space-y-2 mt-4">
          <NavItem icon={<FaChartBar />} label="نظرة عامة" active={activeTab === 'overview'} onClick={() => setActiveTab('overview')} />
          <NavItem
            icon={<FaCheckCircle />}
            label="الطلبات المكتملة"
            badge={awaitingCount}
            active={activeTab === 'completed'}
            onClick={() => setActiveTab('completed')}
          />
          <NavItem icon={<FaUsers />} label="إدارة الطلاب" active={activeTab === 'students'} onClick={() => setActiveTab('students')} />
          <NavItem icon={<FaUserTie />} label="إدارة مزودي الخدمة" active={activeTab === 'providers'} onClick={() => setActiveTab('providers')} />
          <NavItem
            icon={<FaIdCard />}
            label="طلبات تغيير البيانات"
            badge={pendingProfileChangesCount}
            active={activeTab === 'profileChanges'}
            onClick={() => setActiveTab('profileChanges')}
          />
          <NavItem
            icon={<FaFlag />}
            label="بلاغات الطلاب"
            badge={pendingReportsCount}
            active={activeTab === 'reports'}
            onClick={() => setActiveTab('reports')}
          />
          <NavItem icon={<FaComments />} label="المحادثات" active={activeTab === 'conversations'} onClick={() => setActiveTab('conversations')} />
          <NavItem
            icon={<FaWallet />}
            label="المحفظة والسحب"
            badge={pendingWithdrawalsCount}
            active={activeTab === 'finance'}
            onClick={() => setActiveTab('finance')}
          />
          <NavItem icon={<FaPlus />} label="إدارة الخدمات" active={activeTab === 'services'} onClick={() => setActiveTab('services')} />
        </nav>
        <div className="p-4 border-t border-white/10">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 text-red-300 hover:text-red-100 transition-colors w-full p-3 font-bold text-sm"
          >
            <FaSignOutAlt /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* 2. المحتوى الرئيسي */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* header */}
        <header className="h-20 bg-white border-b border-gray-200 flex items-center justify-between px-10 shrink-0 relative z-20">
          <h2 className="text-2xl font-black text-gray-800">مرحباً بك يا مدير النظام</h2>
          <div className="flex items-center gap-6">
            <div className="text-gray-400 text-sm font-bold">
              {new Date().toLocaleDateString('ar-EG', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
            <NotificationBell
              onSelect={handleNotificationSelect}
              align="left"
              iconClassName="text-gray-500 hover:text-academic-gold"
            />
          </div>
        </header>

        {/* Working area */}
        <div className="flex-1 p-8 overflow-hidden">
          {/* نظرة عامة */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-12 gap-8 h-full overflow-hidden">
              {/* الجانب الأيمن: الإحصائيات والجدول (8 أعمدة) */}
              <div className="col-span-8 flex flex-col gap-8 overflow-hidden">
                {/* بطاقات الإحصائيات السريعة */}
                <div className="grid grid-cols-4 gap-4 shrink-0">
                  <StatCard icon={<FaUsers />} label="إجمالي الطلاب" value={studentsCount.toString()} color="blue" />
                  <StatCard icon={<FaUserTie />} label="مزودي الخدمة" value={providersCount.toString()} color="blue" />
                  <StatCard icon={<FaCheckCircle />} label="الطلبات المكتملة" value={completedCount.toString()} color="gold" />
                  <StatCard icon={<FaClipboardCheck />} label="بانتظار المراجعة" value={awaitingCount.toString()} color="gold" />
                </div>
                <div className="grid grid-cols-2 gap-4 shrink-0">
                  <StatCard icon={<FaWallet />} label="رصيد المنصة" value={`${Number(platformBalance).toLocaleString('ar-IQ')} د.ع`} color="gold" />
                  <StatCard icon={<FaCreditCard />} label="طلبات سحب معلّقة" value={pendingWithdrawalsCount.toString()} color="blue" />
                </div>

                {/* طلبات بانتظار مراجعة الأدمن */}
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex-1 flex flex-col overflow-hidden">
                  <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="font-black text-gray-800">طلبات أكملها المزودون وبانتظار اعتمادك</h3>
                    <span className="text-xs font-bold text-gray-400 tracking-tighter">{awaitingOrders.length} طلب</span>
                  </div>
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                    {awaitingOrders.length > 0 ? (
                      renderOrdersTable(awaitingOrders, { compact: true })
                    ) : (
                      <div className="flex items-center justify-center h-full text-gray-400">
                        <p>لا توجد طلبات بانتظار المراجعة حالياً</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* الجانب الأيسر: إضافة خدمة جديدة (4 أعمدة) */}
              <div className="col-span-4 flex flex-col gap-6 shrink-0 overflow-y-auto custom-scrollbar">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                  <h3 className="text-xl font-black mb-6 text-center" style={{ color: academicBlue }}>
                    إضافة خدمة للموقع
                  </h3>
                  <ServiceForm onSubmit={handleCreateService} />
                </div>

                <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                  <p className="text-amber-800 text-sm font-medium leading-relaxed">
                    💡 عند إضافة خدمة جديدة تظهر فوراً في صفحة الطالب ويصل إشعار لمزودي الخدمة والطلاب.
                    وعند إكمال مزود لطلب يصلك إشعار هنا للتحقق منه واعتماده قبل تسليمه للطالب.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* الطلبات المكتملة */}
          {activeTab === 'completed' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-xl">جميع الطلبات المكتملة</h3>
                <span className="text-xs font-bold text-gray-400">
                  {awaitingOrders.length} بانتظار المراجعة · {finishedOrders.length - awaitingOrders.length} معتمد
                </span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {finishedOrders.length > 0 ? (
                  renderOrdersTable(finishedOrders)
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>لا توجد طلبات مكتملة حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'finance' && (
            <div className="h-full overflow-y-auto custom-scrollbar space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-3xl border border-gray-100 p-6">
                  <p className="text-sm text-gray-400 font-bold">رصيد المنصة</p>
                  <p className="text-2xl font-black text-academic-blue mt-2">{Number(platformBalance).toLocaleString('ar-IQ')} دينار</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6">
                  <p className="text-sm text-gray-400 font-bold">عمولة الطلبات الجديدة</p>
                  <div className="flex gap-2 mt-3">
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={commissionInput}
                      onChange={(e) => setCommissionInput(e.target.value)}
                      placeholder={`${commissionPercent}`}
                      className="w-24 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCommission}
                      className="px-4 py-2 rounded-xl text-white text-sm font-bold"
                      style={{ backgroundColor: academicBlue }}
                    >
                      حفظ
                    </button>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">الحالية {commissionPercent}% · تُثبَّت على الطلب عند إنشائه</p>
                </div>
                <div className="bg-white rounded-3xl border border-gray-100 p-6">
                  <p className="text-sm text-gray-400 font-bold">سحب ماستركارد معلّق</p>
                  <p className="text-2xl font-black text-orange-600 mt-2">{pendingWithdrawalsCount}</p>
                </div>
              </div>

              {revealedCard && (
                <div className="bg-amber-50 border border-amber-100 rounded-3xl p-5 text-sm">
                  <p className="font-black text-amber-800 mb-2">بيانات التحويل — استخدمها ثم أغلق النافذة</p>
                  <p>الاسم: {revealedCard.cardHolderName}</p>
                  <p>البطاقة: {revealedCard.cardNumber}</p>
                  <p>الانتهاء: {revealedCard.cardExpiry || '—'}</p>
                  <p>المبلغ: {Number(revealedCard.amount).toLocaleString('ar-IQ')} دينار</p>
                  <button type="button" className="mt-3 text-xs font-bold text-amber-700" onClick={() => setRevealedCard(null)}>إخفاء الرقم</button>
                </div>
              )}

              <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-6">
                <h3 className="font-black text-gray-800 text-xl mb-4">طلبات سحب الماستركارد</h3>
                {(finance?.withdrawals || []).length === 0 ? (
                  <p className="text-sm text-gray-400">لا توجد طلبات سحب</p>
                ) : (
                  <div className="space-y-3">
                    {finance.withdrawals.map((item) => (
                      <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 rounded-2xl px-4 py-3">
                        <div>
                          <p className="font-black text-gray-800">{item.provider?.name || 'مزود'} · {Number(item.amount).toLocaleString('ar-IQ')} دينار</p>
                          <p className="text-xs text-gray-500">ماستركارد ****{item.cardLast4} · {item.cardHolderName} · {item.status}</p>
                        </div>
                        {item.status === 'pending' && (
                          <div className="flex gap-2">
                            <button type="button" onClick={() => handleRevealCard(item)} className="px-3 py-2 rounded-xl bg-white border text-xs font-bold">عرض البطاقة</button>
                            <button type="button" onClick={() => handleReviewWithdrawal(item, 'paid')} className="px-3 py-2 rounded-xl bg-green-600 text-white text-xs font-bold">تم التحويل</button>
                            <button type="button" onClick={() => handleReviewWithdrawal(item, 'rejected')} className="px-3 py-2 rounded-xl bg-red-500 text-white text-xs font-bold">رفض</button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* إدارة الطلاب */}
          {activeTab === 'students' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-black text-gray-800 text-xl">إدارة الطلاب ({studentsCount})</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                <UsersTable
                  users={students}
                  emptyText="لا يوجد طلاب مسجلين حالياً"
                  onDelete={(u) => handleDeleteUser(u.id, u.name)}
                  onRestrict={(u) => setRestrictTarget({ id: u.id, name: u.name })}
                  onUnrestrict={handleUnrestrictStudent}
                />
              </div>
            </div>
          )}

          {/* إدارة مزودي الخدمة */}
          {activeTab === 'providers' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-xl">إدارة مزودي الخدمة ({providersCount})</h3>
                <button
                  onClick={() => setShowProviderForm((v) => !v)}
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-white font-bold text-sm"
                  style={{ backgroundColor: academicBlue }}
                >
                  <FaUserPlus /> {showProviderForm ? 'إغلاق' : 'إضافة مزود خدمة'}
                </button>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {showProviderForm && (
                  <div className="bg-gray-50 border border-gray-100 rounded-2xl p-6 mb-6 max-w-xl">
                    <ProviderForm onSubmit={handleCreateProvider} />
                  </div>
                )}
                <UsersTable
                  users={providers}
                  emptyText="لا يوجد مزودي خدمة مسجلين حالياً"
                  onDelete={(u) => handleDeleteUser(u.id, u.name)}
                  onEdit={(u) => setEditProvider(u)}
                  showContact
                />
              </div>
            </div>
          )}

          {/* طلبات تغيير بيانات المزودين */}
          {activeTab === 'profileChanges' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-xl">طلبات تغيير بيانات المزودين</h3>
                <span className="text-xs font-bold text-gray-400">{pendingProfileChangesCount} طلب بانتظار المراجعة</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {profileChanges.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>لا توجد طلبات تغيير حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {profileChanges.map((req) => {
                      const statusMeta =
                        req.status === 'approved'
                          ? { text: 'تمت الموافقة', className: 'bg-green-100 text-green-700' }
                          : req.status === 'rejected'
                            ? { text: 'مرفوض', className: 'bg-red-100 text-red-700' }
                            : { text: 'قيد المراجعة', className: 'bg-orange-100 text-orange-800' };
                      return (
                        <div key={req.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800">{req.provider?.name || 'مزود خدمة'}</h4>
                              <p className="text-sm text-gray-500">{req.provider?.email}</p>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta.className}`}>
                              {statusMeta.text}
                            </span>
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-700 mb-3">
                            {req.requestedName && <p>الاسم المطلوب: <span className="font-bold">{req.requestedName}</span></p>}
                            {req.requestedPhone && <p>الهاتف المطلوب: <span className="font-bold">{req.requestedPhone}</span></p>}
                            {req.requestedEmail && <p>البريد المطلوب: <span className="font-bold">{req.requestedEmail}</span></p>}
                            {req.requestedBio && <p className="md:col-span-2">الوصف المطلوب: {req.requestedBio}</p>}
                          </div>
                          {req.note && <p className="text-sm text-gray-500 mb-2">ملاحظة المزود: {req.note}</p>}
                          <div className="flex flex-wrap gap-2 mb-3">
                            {(req.documents || []).map((doc) => (
                              <button
                                key={doc.index}
                                type="button"
                                onClick={() => handleDownloadChangeDoc(req, doc.index, doc.originalName)}
                                className="px-3 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-bold text-academic-blue flex items-center gap-2"
                              >
                                <FaDownload /> {doc.originalName}
                              </button>
                            ))}
                          </div>
                          <p className="text-xs text-gray-400 mb-3">{formatDateTime(req.createdAt)}</p>
                          {req.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleReviewProfileChange(req, 'approved')}
                                className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-bold"
                              >
                                موافقة وتطبيق التغيير
                              </button>
                              <button
                                onClick={() => handleReviewProfileChange(req, 'rejected')}
                                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl text-sm font-bold"
                              >
                                رفض
                              </button>
                            </div>
                          )}
                          {req.adminNote && <p className="text-sm text-gray-500 mt-2">ملاحظة الإدارة: {req.adminNote}</p>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* بلاغات الطلاب */}
          {activeTab === 'reports' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50 flex justify-between items-center">
                <h3 className="font-black text-gray-800 text-xl">بلاغات مزودي الخدمة عن الطلاب</h3>
                <span className="text-xs font-bold text-gray-400">{pendingReportsCount} بلاغ بانتظار المراجعة</span>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {reports.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>لا توجد بلاغات حالياً</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {reports.map((report) => {
                      const statusMeta = REPORT_STATUS_META[report.status] || REPORT_STATUS_META.pending;
                      const studentRestricted = restrictionBadge(report.reported);
                      return (
                        <div key={report.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                          <div className="flex justify-between items-start gap-4 mb-3">
                            <div>
                              <h4 className="font-bold text-gray-800">
                                الطالب: {report.reported?.name || '—'}
                                <span className="text-gray-400 font-normal text-sm mr-2">
                                  {report.reported?.email}
                                </span>
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                المبلّغ: {report.reporter?.name || 'مزود خدمة'} · الطلب: {report.order?.title || `#${report.orderId?.slice(-6)}`}
                              </p>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusMeta.className}`}>
                                {statusMeta.text}
                              </span>
                              {studentRestricted && (
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${studentRestricted.className}`}>
                                  {studentRestricted.text}
                                </span>
                              )}
                            </div>
                          </div>
                          <p className="text-sm font-bold text-academic-blue mb-1">
                            السبب: {REPORT_REASON_LABEL[report.reason] || report.reason}
                          </p>
                          <p className="text-sm text-gray-700 bg-white rounded-xl p-3 border border-gray-100">{report.details}</p>
                          <p className="text-xs text-gray-400 mt-2">{formatDateTime(report.createdAt)}</p>
                          <div className="mt-4 flex flex-wrap gap-2">
                            {report.orderId && (
                              <button
                                onClick={() => setViewingOrderId(report.orderId)}
                                className="px-4 py-2 bg-academic-blue text-white rounded-xl text-sm font-bold hover:bg-academic-blue-dark"
                              >
                                قراءة المحادثة
                              </button>
                            )}
                            {report.status === 'pending' && report.reportedId && (
                              <button
                                onClick={() =>
                                  setRestrictTarget({
                                    id: report.reportedId,
                                    name: report.reported?.name || 'الطالب',
                                    reportId: report.id,
                                  })
                                }
                                className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white flex items-center gap-2"
                              >
                                <FaBan /> تقييد / حظر الطالب
                              </button>
                            )}
                            {report.status === 'pending' && (
                              <button
                                onClick={() => handleDismissReport(report)}
                                className="px-4 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold hover:bg-gray-200"
                              >
                                رفض البلاغ
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* المحادثات */}
          {activeTab === 'conversations' && (
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm h-full flex flex-col overflow-hidden">
              <div className="p-6 border-b border-gray-50">
                <h3 className="font-black text-gray-800 text-xl">المحادثات والطلبات</h3>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
                {conversations.length > 0 ? (
                  <div className="space-y-4">
                    {conversations.map((conv) => (
                      <div key={conv.orderId} className="bg-gray-50 rounded-2xl p-4 border border-gray-100">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-bold text-gray-800">طلب #{conv.orderId?.slice(-6)}</h4>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(conv.orderDetails?.status)}`}>
                            {getStatusText(conv.orderDetails?.status)}
                          </span>
                        </div>
                        {conv.orderDetails && (
                          <p className="text-sm text-gray-600 mb-2">
                            الخدمة: {conv.orderDetails.title || conv.orderDetails.service_type || 'خدمة'}
                          </p>
                        )}
                        <p className="text-sm text-gray-500">
                          الطالب: {conv.student?.name || '—'} · المزود: {conv.provider?.name || 'لم يُحدد بعد'}
                        </p>
                        <p className="text-sm text-gray-500">
                          عدد الرسائل: {conv.messageCount || conv.messages?.length || 0}
                        </p>
                        <div className="mt-3 flex gap-2">
                          <button
                            onClick={() => setViewingOrderId(conv.orderId)}
                            className="px-4 py-2 bg-academic-blue text-white rounded-xl text-sm font-bold hover:bg-academic-blue-dark transition-colors"
                          >
                            قراءة المحادثة
                          </button>
                          <button
                            onClick={() => handleDeleteOrder(conv.orderId, conv.orderDetails?.title)}
                            className="px-4 py-2 bg-red-50 text-red-600 border border-red-200 rounded-xl text-sm font-bold hover:bg-red-600 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <FaTrash /> حذف الطلب
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400">
                    <p>لا توجد محادثات حالياً</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* إدارة الخدمات */}
          {activeTab === 'services' && (
            <div className="grid grid-cols-12 gap-8 h-full overflow-hidden">
              <div className="col-span-5 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 overflow-y-auto custom-scrollbar">
                <h3 className="font-black text-gray-800 text-xl mb-6">إضافة خدمة جديدة</h3>
                <ServiceForm onSubmit={handleCreateService} />
              </div>
              <div className="col-span-7 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
                <div className="p-6 border-b border-gray-50">
                  <h3 className="font-black text-gray-800 text-xl">الخدمات المنشورة ({services.length})</h3>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                  {services.length === 0 && (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      <p>لم تُضف أي خدمة بعد</p>
                    </div>
                  )}
                  {services.map((service) => (
                    <div
                      key={service.id}
                      className={`rounded-2xl border p-4 flex items-start justify-between gap-4 ${
                        service.isActive ? 'bg-gray-50 border-gray-100' : 'bg-gray-100 border-gray-200 opacity-70'
                      }`}
                    >
                      <div className="flex-1">
                        <h4 className="font-bold text-gray-800">
                          {service.title}
                          {!service.isActive && <span className="text-xs text-red-500 mr-2">(مخفية عن الطلاب)</span>}
                        </h4>
                        <p className="text-sm text-gray-500 mt-1 whitespace-pre-line">{service.description || '—'}</p>
                        <p className="text-sm font-bold text-academic-gold mt-2">
                          {service.price > 0 ? `${service.price} دينار` : 'السعر بالتفاهم'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleService(service)}
                          className={`text-2xl ${service.isActive ? 'text-green-600' : 'text-gray-400'}`}
                          title={service.isActive ? 'إخفاء الخدمة' : 'إظهار الخدمة'}
                        >
                          {service.isActive ? <FaToggleOn /> : <FaToggleOff />}
                        </button>
                        <button
                          onClick={() => handleDeleteService(service)}
                          className="p-2 bg-white rounded-xl shadow-sm text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                          title="حذف الخدمة"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {viewingOrderId && (
        <ConversationViewer
          orderId={viewingOrderId}
          adminId={user?.id}
          onClose={() => setViewingOrderId(null)}
        />
      )}

      {restrictTarget && (
        <RestrictModal
          studentName={restrictTarget.name}
          onClose={() => setRestrictTarget(null)}
          onSubmit={handleRestrictStudent}
        />
      )}

      {editProvider && (
        <EditProviderModal
          provider={editProvider}
          onClose={() => setEditProvider(null)}
          onSubmit={handleUpdateProvider}
        />
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E5E7EB; border-radius: 10px; }
      `}</style>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────────────────

const NavItem = ({ icon, label, active, onClick, badge }) => (
  <div
    onClick={onClick}
    className={`flex items-center gap-3 p-4 rounded-2xl cursor-pointer transition-all ${
      active ? 'bg-white/10 text-academic-gold' : 'text-blue-100/70 hover:bg-white/5 hover:text-white'
    }`}
  >
    <span className="text-lg">{icon}</span>
    <span className="font-bold text-sm flex-1">{label}</span>
    {badge > 0 && (
      <span className="bg-red-500 text-white text-xs font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
        {badge}
      </span>
    )}
  </div>
);

NavItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  active: PropTypes.bool,
  onClick: PropTypes.func,
  badge: PropTypes.number,
};

const StatCard = ({ icon, label, value, color }) => {
  const styles =
    color === 'blue'
      ? { bg: 'bg-blue-50', text: '#1A5276', iconBg: 'bg-blue-100' }
      : { bg: 'bg-amber-50', text: '#B45309', iconBg: 'bg-amber-100' };

  return (
    <div
      className={`${styles.bg} p-5 rounded-[2rem] border border-white flex items-center gap-4 shadow-sm transition-transform hover:scale-[1.02]`}
    >
      <div className={`${styles.iconBg} w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shrink-0`} style={{ color: styles.text }}>
        {icon}
      </div>
      <div>
        <p className="text-[11px] font-bold text-gray-500 tracking-wide mb-1">{label}</p>
        <p className="text-3xl font-black" style={{ color: styles.text }}>
          {value}
        </p>
      </div>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['blue', 'gold']).isRequired,
};

const inputClass =
  'w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none focus:border-academic-gold transition-all';

const ServiceForm = ({ onSubmit }) => {
  const [form, setForm] = useState({ title: '', description: '', price: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.title.trim().length < 2) return;
    setSubmitting(true);
    const ok = await onSubmit({ ...form, title: form.title.trim(), description: form.description.trim() });
    setSubmitting(false);
    if (ok) setForm({ title: '', description: '', price: '' });
  };

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 mr-1">عنوان الخدمة</label>
        <input
          type="text"
          required
          minLength={2}
          maxLength={100}
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="مثلاً: تدقيق لغوي"
          className={inputClass}
        />
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 mr-1">وصف الخدمة</label>
        <textarea
          rows="3"
          maxLength={1000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="وصف مختصر يظهر للطلاب..."
          className={`${inputClass} resize-none`}
        ></textarea>
      </div>
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-400 mr-1">السعر (دينار) — اتركه فارغاً للتفاهم</label>
        <input
          type="number"
          min="0"
          step="any"
          value={form.price}
          onChange={(e) => setForm({ ...form, price: e.target.value })}
          placeholder="مثلاً: 5000"
          className={inputClass}
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-4 rounded-2xl text-white font-bold flex items-center justify-center gap-3 shadow-lg shadow-blue-900/20 disabled:opacity-60"
        style={{ backgroundColor: academicBlue }}
      >
        <FaPlus /> {submitting ? 'جاري النشر...' : 'نشر الخدمة الآن'}
      </button>
    </form>
  );
};

ServiceForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const ProviderForm = ({ onSubmit }) => {
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', bio: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    const ok = await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      password: form.password,
      phone: form.phone.trim(),
      bio: form.bio.trim(),
    });
    setSubmitting(false);
    if (ok) setForm({ name: '', email: '', password: '', phone: '', bio: '' });
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <h4 className="font-black text-gray-800">إضافة مزود خدمة جديد</h4>
      <input
        type="text"
        required
        minLength={3}
        maxLength={50}
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        placeholder="اسم المزود"
        className={inputClass}
      />
      <input
        type="email"
        required
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        placeholder="البريد الإلكتروني (مثلاً: name@academic.com)"
        className={inputClass}
        dir="ltr"
      />
      <input
        type="tel"
        required
        minLength={8}
        maxLength={30}
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        placeholder="رقم الهاتف الحقيقي (مثلاً: 07701234567)"
        className={inputClass}
        dir="ltr"
      />
      <textarea
        value={form.bio}
        onChange={(e) => setForm({ ...form, bio: e.target.value })}
        placeholder="وصف تعريفي يظهر في الملف الشخصي"
        rows={3}
        maxLength={1000}
        className={inputClass}
      />
      <input
        type="password"
        required
        minLength={6}
        value={form.password}
        onChange={(e) => setForm({ ...form, password: e.target.value })}
        placeholder="كلمة المرور (6 أحرف على الأقل)"
        className={inputClass}
        dir="ltr"
      />
      <button
        type="submit"
        disabled={submitting}
        className="w-full py-3 rounded-2xl text-white font-bold disabled:opacity-60"
        style={{ backgroundColor: academicBlue }}
      >
        {submitting ? 'جاري الإضافة...' : 'إضافة المزود'}
      </button>
    </form>
  );
};

ProviderForm.propTypes = {
  onSubmit: PropTypes.func.isRequired,
};

const UsersTable = ({ users, emptyText, onDelete, onRestrict, onUnrestrict, onEdit, showContact }) => {
  if (users.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-400 min-h-40">
        <p>{emptyText}</p>
      </div>
    );
  }
  return (
    <table className="w-full text-right border-separate border-spacing-y-3">
      <thead>
        <tr className="text-gray-400 text-xs font-bold uppercase">
          <th className="px-4 pb-2">الاسم</th>
          <th className="px-4 pb-2">البريد الإلكتروني</th>
          {showContact && <th className="px-4 pb-2">الهاتف</th>}
          <th className="px-4 pb-2">تاريخ التسجيل</th>
          {onRestrict && <th className="px-4 pb-2">الحالة</th>}
          <th className="px-4 pb-2 text-center">الإجراءات</th>
        </tr>
      </thead>
      <tbody>
        {users.map((u) => {
          const badge = restrictionBadge(u);
          return (
            <tr key={u.id} className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4 rounded-r-2xl font-bold text-sm text-gray-800">{u.name}</td>
              <td className="px-4 py-4 text-sm text-gray-600">{u.email}</td>
              {showContact && <td className="px-4 py-4 text-sm text-gray-600">{u.phone || '—'}</td>}
              <td className="px-4 py-4 text-sm text-gray-500">{formatDate(u.created_at || u.createdAt)}</td>
              {onRestrict && (
                <td className="px-4 py-4">
                  {badge ? (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${badge.className}`}>{badge.text}</span>
                  ) : (
                    <span className="text-xs font-bold text-green-700 bg-green-50 px-3 py-1 rounded-full">نشط</span>
                  )}
                </td>
              )}
              <td className="px-4 py-4 rounded-l-2xl text-center">
                <div className="inline-flex items-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(u)}
                      className="p-2 bg-white rounded-xl shadow-sm text-academic-blue hover:bg-academic-blue hover:text-white transition-all border border-blue-100"
                      title="تعديل الهاتف والوصف"
                    >
                      <FaEdit />
                    </button>
                  )}
                  {onRestrict && !badge && (
                    <button
                      onClick={() => onRestrict(u)}
                      className="p-2 bg-white rounded-xl shadow-sm text-orange-600 hover:bg-orange-600 hover:text-white transition-all border border-orange-100"
                      title="تقييد الحساب"
                    >
                      <FaBan />
                    </button>
                  )}
                  {onUnrestrict && badge && (
                    <button
                      onClick={() => onUnrestrict(u)}
                      className="p-2 bg-white rounded-xl shadow-sm text-green-700 hover:bg-green-600 hover:text-white transition-all border border-green-100"
                      title="فك التقييد"
                    >
                      <FaUnlock />
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(u)}
                    className="p-2 bg-white rounded-xl shadow-sm text-red-600 hover:bg-red-600 hover:text-white transition-all border border-red-100"
                    title="حذف"
                  >
                    <FaTrash />
                  </button>
                </div>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

UsersTable.propTypes = {
  users: PropTypes.array.isRequired,
  emptyText: PropTypes.string.isRequired,
  onDelete: PropTypes.func.isRequired,
  onRestrict: PropTypes.func,
  onUnrestrict: PropTypes.func,
  onEdit: PropTypes.func,
  showContact: PropTypes.bool,
};

const EditProviderModal = ({ provider, onClose, onSubmit }) => {
  const [form, setForm] = useState({
    name: provider.name || '',
    email: provider.email || '',
    phone: provider.phone || '',
    bio: provider.bio || '',
  });
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        bio: form.bio.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-black text-gray-800 mb-1">تعديل بيانات المزود</h3>
        <p className="text-sm text-gray-500 mb-4">رقم الهاتف والوصف التعريفي يظهران في الملف الشخصي.</p>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input className={inputClass} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="الاسم" required />
          <input className={inputClass} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="البريد" required />
          <input className={inputClass} type="tel" required minLength={8} maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="رقم الهاتف الحقيقي" />
          <textarea className={inputClass} rows={4} maxLength={1000} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} placeholder="الوصف التعريفي" />
          <div className="flex gap-3">
            <button type="submit" disabled={busy} className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50" style={{ backgroundColor: academicBlue }}>
              {busy ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button type="button" onClick={onClose} className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700">إلغاء</button>
          </div>
        </form>
      </div>
    </div>
  );
};

EditProviderModal.propTypes = {
  provider: PropTypes.object.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

const RestrictModal = ({ studentName, onClose, onSubmit }) => {
  const [type, setType] = useState('temporary');
  const [days, setDays] = useState(7);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      await onSubmit({
        type,
        days: type === 'temporary' ? Number(days) : undefined,
        reason: reason.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <h3 className="text-xl font-black text-gray-800 mb-1">تقييد حساب الطالب</h3>
        <p className="text-sm text-gray-500 mb-4">
          {studentName} — لن يتمكن من تسجيل الدخول أو استخدام المنصة أثناء التقييد.
        </p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setType('temporary')}
              className={`py-2.5 rounded-xl font-bold text-sm border ${
                type === 'temporary'
                  ? 'bg-orange-50 text-orange-700 border-orange-200'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}
            >
              تقييد لفترة
            </button>
            <button
              type="button"
              onClick={() => setType('permanent')}
              className={`py-2.5 rounded-xl font-bold text-sm border ${
                type === 'permanent'
                  ? 'bg-red-50 text-red-700 border-red-200'
                  : 'bg-gray-50 text-gray-600 border-gray-100'
              }`}
            >
              حظر نهائي
            </button>
          </div>
          {type === 'temporary' && (
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-1">مدة التقييد</label>
              <select
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2"
              >
                <option value={1}>يوم واحد</option>
                <option value={3}>3 أيام</option>
                <option value={7}>أسبوع</option>
                <option value={14}>أسبوعان</option>
                <option value={30}>شهر</option>
                <option value={90}>3 أشهر</option>
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-bold text-gray-700 mb-1">السبب (اختياري)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              maxLength={500}
              placeholder="سيظهر للطالب عند محاولة الدخول"
              className="w-full border border-gray-200 rounded-xl px-3 py-2"
            />
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={busy}
              className="flex-1 py-2.5 rounded-xl text-white font-bold disabled:opacity-50"
              style={{ backgroundColor: type === 'permanent' ? '#DC2626' : academicBlue }}
            >
              {busy ? 'جاري التنفيذ...' : type === 'permanent' ? 'حظر الحساب نهائياً' : 'تقييد الحساب'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl font-bold bg-gray-100 text-gray-700"
            >
              إلغاء
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

RestrictModal.propTypes = {
  studentName: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
};

const OrderRow = ({ order, compact, expanded, onToggleFiles, onApprove, onReturn, onDelete }) => {
  const iconBtn = 'p-2 rounded-lg transition-colors';
  const columns = compact ? 6 : 8;
  return (
    <>
      <tr className="bg-gray-50/50 hover:bg-gray-50 transition-colors">
        <td className="px-4 py-4 rounded-r-2xl font-bold text-sm text-gray-500">#{order.id?.slice(-6)}</td>
        <td className="px-4 py-4 font-black text-gray-800 text-sm">{order.title}</td>
        {!compact && <td className="px-4 py-4 text-sm text-gray-600">{order.student?.name || '—'}</td>}
        <td className="px-4 py-4 font-bold text-blue-600 text-sm">{order.provider?.name || 'غير محدد'}</td>
        {!compact && (
          <td className="px-4 py-4 text-xs text-gray-600">
            <p>{Number(order.price || 0).toLocaleString('ar-IQ')} د.ع</p>
            <p className="text-green-700">مزود {Number(order.providerAmount || 0).toLocaleString('ar-IQ')}</p>
            <p className="text-amber-700">عمولة {Number(order.commissionAmount || 0).toLocaleString('ar-IQ')}</p>
            {order.paymentStatus === 'reserved' && <p className="text-blue-700">ماستركارد · ملتزم بالشراء</p>}
          </td>
        )}
        <td className="px-4 py-4">
          <span className={`px-3 py-1 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>
            {getStatusText(order.status)}
          </span>
        </td>
        <td className="px-4 py-4 text-center">
          <button
            onClick={onToggleFiles}
            className="inline-flex items-center gap-1 text-xs font-bold text-academic-blue hover:text-academic-gold"
            title="عرض الملفات"
          >
            <FaPaperclip /> {order.filesCount || 0}
          </button>
        </td>
        <td className="px-4 py-4 rounded-l-2xl text-center whitespace-nowrap">
          {order.status === 'completed' && (
            <>
              <button
                onClick={onApprove}
                className={`${iconBtn} text-green-600 hover:bg-green-50`}
                title="اعتماد وتسليم للطالب"
              >
                <FaCheckCircle />
              </button>
              <button
                onClick={onReturn}
                className={`${iconBtn} text-amber-600 hover:bg-amber-50`}
                title="إرجاع للمزود للتعديل"
              >
                <FaUndo />
              </button>
            </>
          )}
          <button onClick={onDelete} className={`${iconBtn} text-red-500 hover:bg-red-50`} title="حذف الطلب">
            <FaTrash />
          </button>
        </td>
      </tr>
      {expanded && (
        <tr>
          <td colSpan={columns} className="px-4 pb-3">
            <OrderFilesList orderId={order.id} />
          </td>
        </tr>
      )}
    </>
  );
};

OrderRow.propTypes = {
  order: PropTypes.object.isRequired,
  compact: PropTypes.bool,
  expanded: PropTypes.bool,
  onToggleFiles: PropTypes.func.isRequired,
  onApprove: PropTypes.func.isRequired,
  onReturn: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
};

const OrderFilesList = ({ orderId }) => {
  const { data: files = [], isLoading } = useQuery({
    queryKey: ['orderFiles', orderId],
    queryFn: async () => (await filesAPI.getOrderFiles(orderId)).data?.files || [],
  });

  const handleDownload = async (file) => {
    try {
      await downloadOrderFile(file);
    } catch (err) {
      alert(err?.message || 'تعذر تحميل الملف');
    }
  };

  if (isLoading) return <p className="text-xs text-gray-400 p-3">جاري تحميل الملفات...</p>;
  if (files.length === 0) return <p className="text-xs text-gray-400 p-3">لا توجد ملفات مرفوعة لهذا الطلب</p>;

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-3 space-y-2">
      {files.map((file) => (
        <div key={file.id} className="flex items-center justify-between gap-3 text-sm">
          <div className="min-w-0">
            <p className="font-bold text-gray-700 break-all">{file.originalName}</p>
            <p className="text-xs text-gray-400">
              {file.uploader?.name ? `${file.uploader.name} · ` : ''}
              {formatSize(file.size)} · {formatDate(file.createdAt)}
            </p>
          </div>
          <button
            onClick={() => handleDownload(file)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-academic-blue text-white text-xs font-bold hover:opacity-90 shrink-0"
          >
            <FaDownload /> تحميل
          </button>
        </div>
      ))}
    </div>
  );
};

OrderFilesList.propTypes = {
  orderId: PropTypes.string.isRequired,
};

/**
 * Read-only view of a student↔provider conversation, for safety review.
 * Messages are fetched still-encrypted and decrypted HERE, with the admin's own private key
 * (stored only in this browser) — the server never sees the plaintext.
 */
const ConversationViewer = ({ orderId, adminId, onClose }) => {
  const { data, isLoading, isFetching, error, refetch } = useQuery({
    queryKey: ['adminConversationMessages', orderId],
    queryFn: async () => {
      const res = await adminAPI.getConversationMessages(orderId);
      const privateKey = await getStoredPrivateKey(adminId).catch(() => null);

      const messages = await Promise.all(
        res.data.messages.map(async (m) => {
          // Sent without encryption keys (no recipient key at the time): plain base64 fallback
          if (m.isPlain) {
            try {
              return { ...m, status: 'ok', text: decodeURIComponent(atob(m.encryptedMessage)) };
            } catch {
              return { ...m, status: 'error', text: '[تعذر قراءة الرسالة]' };
            }
          }
          if (!m.adminWrappedKey) return { ...m, status: 'no-key', text: null };
          if (!privateKey) return { ...m, status: 'no-private-key', text: null };

          try {
            const text = await decryptMessage(
              { encryptedMessage: m.encryptedMessage, iv: m.iv, wrappedKey: m.adminWrappedKey },
              privateKey
            );
            return { ...m, status: 'ok', text };
          } catch {
            return { ...m, status: 'error', text: null };
          }
        })
      );

      return { order: res.data.order, messages, hasPrivateKey: !!privateKey };
    },
    refetchInterval: 30 * 1000,
  });

  const order = data?.order;
  const messages = data?.messages || [];
  const needsKeyBanner = data && !data.hasPrivateKey && messages.some((m) => m.status === 'no-private-key');

  const placeholder = {
    'no-key': 'رسالة أُرسلت قبل تفعيل مراجعة الإدارة — لا يمكن قراءتها',
    'no-private-key': 'مفتاح فك التشفير غير متوفر في هذا المتصفح',
    error: 'تعذر فك تشفير هذه الرسالة',
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-6" dir="rtl" onClick={onClose}>
      <div
        className="bg-white rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-gray-100 flex items-start justify-between gap-4">
          <div>
            <h3 className="font-black text-gray-800 text-lg">
              {order ? order.title : 'المحادثة'}{' '}
              <span className="text-gray-400 text-sm font-bold">#{orderId.slice(-6)}</span>
            </h3>
            {order && (
              <p className="text-sm text-gray-500 mt-1">
                الطالب: <b>{order.student?.name || '—'}</b> · المزود: <b>{order.provider?.name || 'لم يُحدد بعد'}</b> ·{' '}
                <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${getStatusClass(order.status)}`}>
                  {getStatusText(order.status)}
                </span>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => refetch()}
              className="px-3 py-2 rounded-xl bg-gray-100 text-gray-600 text-xs font-bold hover:bg-gray-200"
            >
              {isFetching ? 'جاري التحديث...' : 'تحديث'}
            </button>
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-red-50 text-red-600 text-xs font-bold hover:bg-red-600 hover:text-white"
            >
              إغلاق
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {needsKeyBanner && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl p-3 text-sm">
              لا يوجد مفتاح فك تشفير لهذا الحساب في هذا المتصفح. مفتاح الأدمن يُنشأ عند تسجيل الدخول
              ويبقى في المتصفح الذي سجلت منه. استخدم نفس المتصفح الذي سجلت منه الدخول أولاً.
            </div>
          )}

          {isLoading && <p className="text-center text-gray-400 py-10">جاري تحميل المحادثة...</p>}
          {error && <p className="text-center text-red-500 py-10">{error.message || 'تعذر تحميل المحادثة'}</p>}
          {!isLoading && !error && messages.length === 0 && (
            <p className="text-center text-gray-400 py-10">لا توجد رسائل في هذه المحادثة بعد</p>
          )}

          {messages.map((m) => {
            const isProvider = m.senderRole === 'provider';
            return (
              <div key={m.id} className={`flex ${isProvider ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl p-4 ${
                    isProvider ? 'bg-academic-blue text-white' : 'bg-white border border-gray-200 text-gray-800'
                  }`}
                >
                  <p className={`text-xs font-bold mb-1 ${isProvider ? 'text-blue-100' : 'text-academic-gold'}`}>
                    {m.senderName} · {isProvider ? 'مزود الخدمة' : m.senderRole === 'student' ? 'الطالب' : m.senderRole}
                  </p>
                  {m.status === 'ok' ? (
                    <p className="whitespace-pre-line break-words">{m.text}</p>
                  ) : (
                    <p className="text-sm italic opacity-70">{placeholder[m.status]}</p>
                  )}
                  <p className={`text-xs mt-2 ${isProvider ? 'text-white/70' : 'text-gray-400'}`}>
                    {new Date(m.createdAt).toLocaleString('ar-EG')}
                  </p>
                </div>
              </div>
            );
          })}

          <div className="pt-2">
            <p className="text-xs font-bold text-gray-400 mb-2">الملفات المرفوعة في هذه المحادثة</p>
            <OrderFilesList orderId={orderId} />
          </div>
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-xs text-gray-400">
          للمراجعة فقط ولا يمكن الرد من هنا. تُسجَّل كل مراجعة للمحادثات في سجل التدقيق.
        </div>
      </div>
    </div>
  );
};

ConversationViewer.propTypes = {
  orderId: PropTypes.string.isRequired,
  adminId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
};
