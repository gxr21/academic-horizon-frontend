import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsAPI } from '../../lib/api';
import { openReceipt } from '../../components/purchase/PaymentPanel';

const academicBlue = '#1A5276';
const formatIqd = (value) => `${Number(value || 0).toLocaleString('ar-IQ')} دينار`;
const formatDate = (iso) =>
  iso ? new Date(iso).toLocaleString('ar-EG', { dateStyle: 'short', timeStyle: 'short' }) : '—';

const newMethodId = () => `pm${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function MethodsEditor() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ['adminPaymentSettings'],
    queryFn: async () => (await paymentsAPI.getSettings()).data,
  });
  const [methods, setMethods] = useState([]);
  const [instructions, setInstructions] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    if (data) {
      setMethods(data.methods || []);
      setInstructions(data.instructions || '');
    }
  }, [data]);

  const update = (index, patch) =>
    setMethods((list) => list.map((m, i) => (i === index ? { ...m, ...patch } : m)));

  const save = async () => {
    setMessage({ type: '', text: '' });
    const cleaned = methods.filter((m) => m.label?.trim() || m.account?.trim());
    if (cleaned.some((m) => !m.label?.trim() || !m.account?.trim())) {
      return setMessage({ type: 'error', text: 'أكمل اسم الطريقة ورقم الحساب لكل سطر' });
    }
    setBusy(true);
    try {
      await paymentsAPI.saveSettings({
        methods: cleaned.map((m) => ({
          id: m.id || newMethodId(),
          label: m.label.trim(),
          account: m.account.trim(),
          holder: (m.holder || '').trim(),
        })),
        instructions,
      });
      await queryClient.invalidateQueries({ queryKey: ['adminPaymentSettings'] });
      queryClient.invalidateQueries({ queryKey: ['paymentInfo'] });
      setMessage({ type: 'ok', text: 'تم الحفظ — ستظهر هذه البيانات للطلاب الآن' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'تعذر الحفظ' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
      <div>
        <h3 className="font-black text-gray-800 text-xl">أين يحوّل الطلاب؟</h3>
        <p className="text-sm text-gray-500 mt-1">
          أضف محافظك الإلكترونية (زين كاش، كي كارد، ...). تظهر للطالب بعد تأكيد الطلب ليحوّل ويرفع الإيصال.
        </p>
      </div>

      {isLoading ? (
        <p className="text-gray-400 text-sm">جاري التحميل...</p>
      ) : (
        <>
          {methods.length === 0 && (
            <p className="rounded-xl bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800">
              لا توجد طرق دفع بعد — لن يستطيع الطلاب رفع إيصالات حتى تضيف واحدة على الأقل.
            </p>
          )}
          {methods.map((m, index) => (
            <div key={m.id || index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_auto] gap-2">
              <input
                value={m.label || ''}
                onChange={(e) => update(index, { label: e.target.value })}
                placeholder="الاسم (مثال: زين كاش)"
                maxLength={60}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
              <input
                value={m.account || ''}
                onChange={(e) => update(index, { account: e.target.value })}
                placeholder="رقم المحفظة / الحساب"
                dir="ltr"
                maxLength={120}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-right"
              />
              <input
                value={m.holder || ''}
                onChange={(e) => update(index, { holder: e.target.value })}
                placeholder="باسم (اختياري)"
                maxLength={80}
                className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
              />
              <button
                type="button"
                onClick={() => setMethods((list) => list.filter((_, i) => i !== index))}
                className="px-3 py-2 rounded-xl border border-red-100 text-red-600 text-sm font-bold"
              >
                حذف
              </button>
            </div>
          ))}

          <button
            type="button"
            disabled={methods.length >= 6}
            onClick={() => setMethods((list) => [...list, { id: newMethodId(), label: '', account: '', holder: '' }])}
            className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 disabled:opacity-50"
          >
            + إضافة طريقة دفع
          </button>

          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            placeholder="تعليمات إضافية تظهر للطالب (اختياري)"
            maxLength={600}
            rows={2}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl"
          />

          {message.text && (
            <p className={`text-sm font-bold ${message.type === 'ok' ? 'text-green-700' : 'text-red-600'}`}>{message.text}</p>
          )}

          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="px-6 py-2 rounded-xl text-white font-bold disabled:opacity-50"
            style={{ backgroundColor: academicBlue }}
          >
            {busy ? 'جاري الحفظ...' : 'حفظ طرق الدفع'}
          </button>
        </>
      )}
    </div>
  );
}

function PaymentCard({ payment, methodLabel, onDecide, busy, readOnly }) {
  const [rejecting, setRejecting] = useState(false);
  const [note, setNote] = useState('');

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 space-y-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-black text-academic-blue">{payment.title}</p>
          <p className="text-xs text-gray-500 mt-1">
            {payment.student?.name || '—'} · {payment.student?.email || ''}
          </p>
        </div>
        <p className="text-xl font-black text-academic-gold">{formatIqd(payment.price)}</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
        <p><span className="font-bold text-gray-400">الرمز:</span> <span dir="ltr" className="font-mono font-bold">{payment.paymentReference}</span></p>
        <p><span className="font-bold text-gray-400">عبر:</span> {methodLabel(payment.paymentChannel)}</p>
        <p><span className="font-bold text-gray-400">رُفع:</span> {formatDate(payment.receiptUploadedAt)}</p>
        {readOnly && <p><span className="font-bold text-gray-400">أُكّد:</span> {formatDate(payment.paymentConfirmedAt)}</p>}
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => openReceipt(payment.id)}
          className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-bold text-gray-700"
        >
          عرض الإيصال
        </button>
        {!readOnly && (
          <>
            <button
              type="button"
              disabled={busy}
              onClick={() => {
                if (window.confirm(`تأكيد أن مبلغ ${formatIqd(payment.price)} وصل فعلاً إلى محفظتك؟ سيُفتح الطلب للمزودين.`)) {
                  onDecide(payment.id, { decision: 'confirm' });
                }
              }}
              className="px-4 py-2 rounded-xl bg-green-600 text-white text-sm font-bold disabled:opacity-50"
            >
              وصل المبلغ — تأكيد
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => setRejecting((v) => !v)}
              className="px-4 py-2 rounded-xl border border-red-200 text-red-600 text-sm font-bold"
            >
              رفض الإيصال
            </button>
          </>
        )}
      </div>

      {rejecting && !readOnly && (
        <div className="space-y-2">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="سبب الرفض (يصل للطالب) — مثال: المبلغ ناقص، أو لم يصلني تحويل بهذا الرمز"
            rows={2}
            maxLength={500}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
          />
          <button
            type="button"
            disabled={busy || note.trim().length < 3}
            onClick={() => onDecide(payment.id, { decision: 'reject', note: note.trim() })}
            className="px-4 py-2 rounded-xl bg-red-600 text-white text-sm font-bold disabled:opacity-50"
          >
            إرسال الرفض
          </button>
        </div>
      )}
    </div>
  );
}

PaymentCard.propTypes = {
  payment: PropTypes.object.isRequired,
  methodLabel: PropTypes.func.isRequired,
  onDecide: PropTypes.func,
  busy: PropTypes.bool,
  readOnly: PropTypes.bool,
};

export default function PaymentsPanel({ onChanged }) {
  const queryClient = useQueryClient();
  const [view, setView] = useState('review');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['adminPaymentSettings'],
    queryFn: async () => (await paymentsAPI.getSettings()).data,
  });
  const methodLabel = (id) => settings?.methods?.find((m) => m.id === id)?.label || id || '—';

  const { data: payments = [], isLoading } = useQuery({
    queryKey: ['adminPayments', view],
    queryFn: async () => (await paymentsAPI.getQueue(view)).data?.payments || [],
    refetchInterval: 30_000,
  });

  const decide = async (orderId, body) => {
    setBusy(true);
    setError('');
    try {
      await paymentsAPI.decide(orderId, body);
      await queryClient.invalidateQueries({ queryKey: ['adminPayments'] });
      onChanged?.();
    } catch (err) {
      setError(err.message || 'تعذر تنفيذ القرار');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto custom-scrollbar space-y-6">
      <div className="bg-white rounded-3xl border border-gray-100 p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="font-black text-gray-800 text-xl">
            {view === 'review' ? 'إيصالات بانتظار المراجعة' : 'آخر المدفوعات المؤكدة'}
          </h3>
          <div className="flex gap-2">
            {[
              ['review', 'بانتظار المراجعة'],
              ['history', 'المؤكدة'],
            ].map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`px-4 py-2 rounded-xl text-sm font-bold ${
                  view === key ? 'text-white' : 'border border-gray-200 text-gray-600'
                }`}
                style={view === key ? { backgroundColor: academicBlue } : undefined}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === 'review' && (
          <p className="text-xs text-gray-500 leading-6">
            افتح تطبيق المحفظة وتأكد أن المبلغ وصل فعلاً (طابِق المبلغ والرمز) قبل التأكيد. التأكيد يفتح الطلب للمزودين.
          </p>
        )}

        {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

        {isLoading ? (
          <p className="text-gray-400 text-sm">جاري التحميل...</p>
        ) : payments.length === 0 ? (
          <p className="text-gray-400 text-sm py-6 text-center">
            {view === 'review' ? 'لا توجد إيصالات بانتظار المراجعة 🎉' : 'لا توجد مدفوعات مؤكدة بعد'}
          </p>
        ) : (
          <div className="space-y-3">
            {payments.map((payment) => (
              <PaymentCard
                key={payment.id}
                payment={payment}
                methodLabel={methodLabel}
                onDecide={decide}
                busy={busy}
                readOnly={view === 'history'}
              />
            ))}
          </div>
        )}
      </div>

      <MethodsEditor />
    </div>
  );
}

PaymentsPanel.propTypes = {
  onChanged: PropTypes.func,
};
