import { useEffect, useState } from 'react';
import { FaArrowRight, FaCreditCard, FaWallet } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import HeaderHome from '../../components/header/headerHome';
import { useAuth } from '../../context/AuthContext';
import { walletAPI } from '../../lib/api';

const academicBlue = '#1A5276';

const TX_LABEL = {
  order_credit: 'أرباح طلب',
  withdrawal_hold: 'حجز سحب ماستركارد',
  withdrawal_paid: 'تم تحويل السحب',
  withdrawal_refund: 'إرجاع سحب مرفوض',
};

const WD_LABEL = {
  pending: { text: 'بانتظار التحويل', className: 'bg-orange-50 text-orange-700 border-orange-100' },
  paid: { text: 'تم التحويل', className: 'bg-green-50 text-green-700 border-green-100' },
  rejected: { text: 'مرفوض', className: 'bg-red-50 text-red-700 border-red-100' },
};

const formatIqd = (value) => `${Number(value || 0).toLocaleString('ar-IQ')} دينار`;

export default function ProviderWallet() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'provider') {
      navigate('/home');
    }
  }, [isAuthenticated, user, navigate]);

  const { data, isLoading } = useQuery({
    queryKey: ['providerWallet'],
    queryFn: async () => (await walletAPI.getMine()).data,
    enabled: user?.role === 'provider',
  });

  const [form, setForm] = useState({
    amount: '',
    cardHolderName: '',
    cardNumber: '',
    cardExpiry: '',
  });
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const wallet = data || {};
  const minWithdrawal = wallet.minWithdrawal || 1000;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleWithdraw = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setBusy(true);
    try {
      const res = await walletAPI.requestWithdrawal({
        amount: Number(form.amount),
        cardHolderName: form.cardHolderName,
        cardNumber: form.cardNumber,
        cardExpiry: form.cardExpiry,
      });
      setMessage(res.message || 'تم إرسال طلب السحب');
      setForm({ amount: '', cardHolderName: '', cardNumber: '', cardExpiry: '' });
      queryClient.invalidateQueries({ queryKey: ['providerWallet'] });
    } catch (err) {
      setError(err.message || 'تعذر إرسال طلب السحب');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal" dir="rtl">
      <HeaderHome />
      <main className="max-w-4xl mx-auto px-4 py-10 space-y-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 font-bold"
          style={{ color: academicBlue }}
        >
          <FaArrowRight /> العودة للوحة التحكم
        </button>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
          <div className="p-8 text-white flex justify-between items-center" style={{ backgroundColor: academicBlue }}>
            <div>
              <h1 className="text-2xl font-black mb-1">محفظة مزود الخدمة</h1>
              <p className="text-blue-100/80 text-sm">
                بعد اعتماد الأدمن للتسليم تُضاف أرباحك هنا، والسحب فقط عبر ماستركارد
              </p>
            </div>
            <div className="bg-white/10 p-4 rounded-2xl">
              <FaWallet className="text-2xl text-academic-gold" />
            </div>
          </div>

          <div className="p-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl bg-amber-50 p-5">
              <p className="text-sm text-amber-700 font-bold">الرصيد المتاح</p>
              <p className="text-2xl font-black text-academic-blue mt-2">
                {isLoading ? '...' : formatIqd(wallet.balance)}
              </p>
            </div>
            <div className="rounded-2xl bg-orange-50 p-5">
              <p className="text-sm text-orange-700 font-bold">محجوز للسحب</p>
              <p className="text-2xl font-black text-orange-800 mt-2">
                {isLoading ? '...' : formatIqd(wallet.pendingWithdrawal)}
              </p>
            </div>
            <div className="rounded-2xl bg-blue-50 p-5">
              <p className="text-sm text-academic-blue font-bold">عمولة المنصة</p>
              <p className="text-2xl font-black text-academic-blue mt-2">{wallet.commissionPercent ?? 15}%</p>
            </div>
          </div>
        </section>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-6">
          <div className="flex items-center gap-3">
            <FaCreditCard style={{ color: academicBlue }} />
            <h2 className="text-xl font-black" style={{ color: academicBlue }}>طلب سحب ماستركارد</h2>
          </div>
          <p className="text-sm text-gray-500">
            أقل مبلغ {formatIqd(minWithdrawal)}. يُحجز الرصيد حتى تحوّل الإدارة المبلغ إلى بطاقتك.
          </p>
          {message && <p className="rounded-2xl bg-green-50 text-green-700 border border-green-100 px-4 py-3 text-sm font-bold">{message}</p>}
          {error && <p className="rounded-2xl bg-red-50 text-red-700 border border-red-100 px-4 py-3 text-sm font-bold">{error}</p>}

          <form onSubmit={handleWithdraw} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <label className="space-y-2">
              <span className="text-xs font-bold text-gray-400">المبلغ بالدينار</span>
              <input
                name="amount"
                type="number"
                min={minWithdrawal}
                value={form.amount}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-gray-400">الاسم على البطاقة</span>
              <input
                name="cardHolderName"
                value={form.cardHolderName}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                required
              />
            </label>
            <label className="space-y-2 md:col-span-2">
              <span className="text-xs font-bold text-gray-400">رقم ماستركارد</span>
              <input
                name="cardNumber"
                inputMode="numeric"
                autoComplete="off"
                value={form.cardNumber}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none tracking-widest"
                placeholder="5xxx xxxx xxxx xxxx"
                required
              />
            </label>
            <label className="space-y-2">
              <span className="text-xs font-bold text-gray-400">الانتهاء MM/YY</span>
              <input
                name="cardExpiry"
                value={form.cardExpiry}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                placeholder="08/28"
                required
              />
            </label>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={busy}
                className="w-full py-3 rounded-xl text-white font-bold disabled:opacity-50"
                style={{ backgroundColor: academicBlue }}
              >
                {busy ? 'جاري الإرسال...' : 'إرسال طلب السحب'}
              </button>
            </div>
          </form>
        </section>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-4">
          <h2 className="text-xl font-black" style={{ color: academicBlue }}>طلبات السحب</h2>
          {(wallet.withdrawals || []).length === 0 ? (
            <p className="text-sm text-gray-400">لا توجد طلبات سحب بعد</p>
          ) : (
            wallet.withdrawals.map((item) => {
              const meta = WD_LABEL[item.status] || WD_LABEL.pending;
              return (
                <div key={item.id} className={`rounded-2xl border px-4 py-3 text-sm ${meta.className}`}>
                  <p className="font-bold">{formatIqd(item.amount)} · ماستركارد ****{item.cardLast4}</p>
                  <p className="opacity-80 mt-1">{meta.text} · {new Date(item.createdAt).toLocaleString('ar-EG')}</p>
                  {item.adminNote && <p className="mt-1">ملاحظة الإدارة: {item.adminNote}</p>}
                </div>
              );
            })
          )}
        </section>

        <section className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 space-y-4">
          <h2 className="text-xl font-black" style={{ color: academicBlue }}>حركة المحفظة</h2>
          {(wallet.transactions || []).length === 0 ? (
            <p className="text-sm text-gray-400">ستظهر الأرباح هنا بعد اعتماد التسليم</p>
          ) : (
            wallet.transactions.map((tx) => (
              <div key={tx.id} className="flex justify-between gap-4 text-sm border-b border-gray-50 pb-3">
                <div>
                  <p className="font-bold text-gray-800">{TX_LABEL[tx.type] || tx.type}</p>
                  <p className="text-gray-400 text-xs">{tx.note}</p>
                </div>
                <p className={`font-black ${tx.direction === 'credit' ? 'text-green-700' : 'text-red-600'}`}>
                  {tx.direction === 'credit' ? '+' : '-'}{formatIqd(tx.amount)}
                </p>
              </div>
            ))
          )}
        </section>
      </main>
    </div>
  );
}
