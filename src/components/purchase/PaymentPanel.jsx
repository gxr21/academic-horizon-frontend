import { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useQuery } from '@tanstack/react-query';
import { paymentsAPI } from '../../lib/api';

const academicBlue = '#1A5276';
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp'];

const formatIqd = (value) => `${Number(value || 0).toLocaleString('ar-IQ')} دينار`;

/** Opens the (private) receipt picture in a new tab. */
export const openReceipt = async (orderId) => {
  const win = window.open('', '_blank');
  try {
    const blob = await paymentsAPI.getReceipt(orderId);
    const url = window.URL.createObjectURL(blob);
    if (win) win.location.href = url;
    else window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 60_000);
  } catch (error) {
    if (win) win.close();
    window.alert(error.message || 'تعذر فتح الإيصال');
  }
};

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard may be blocked; the number is visible anyway */
    }
  };
  return (
    <button
      type="button"
      onClick={copy}
      className="shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1 text-xs font-bold text-gray-600 hover:bg-gray-50"
    >
      {copied ? 'تم النسخ' : 'نسخ'}
    </button>
  );
}

CopyButton.propTypes = { value: PropTypes.string.isRequired };

/**
 * Student payment step: shows where to transfer, takes the receipt picture and sends it.
 * Renders nothing once the admin has confirmed the payment.
 */
export default function PaymentPanel({ order, onUpdated }) {
  const [channel, setChannel] = useState('');
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const status = order?.paymentStatus;
  const needsAction = status === 'unpaid' && Number(order?.price) > 0;

  const { data: info, isLoading } = useQuery({
    queryKey: ['paymentInfo'],
    queryFn: async () => (await paymentsAPI.getInfo()).data,
    enabled: needsAction,
    staleTime: 60_000,
  });

  const methods = info?.methods || [];

  useEffect(() => {
    if (!channel && methods.length === 1) setChannel(methods[0].id);
  }, [methods, channel]);

  useEffect(() => {
    if (!file) {
      setPreview('');
      return undefined;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  if (!order || status === 'reserved' || status === 'collected') return null;
  if (status === 'unpaid' && !(Number(order.price) > 0)) return null;

  const pickFile = (event) => {
    const picked = event.target.files?.[0];
    setError('');
    if (!picked) return;
    if (!ALLOWED.includes(picked.type)) {
      setError('ارفع صورة بصيغة JPG أو PNG أو WEBP');
      return;
    }
    if (picked.size > MAX_BYTES) {
      setError('حجم الصورة يجب ألا يتجاوز 3 ميغابايت');
      return;
    }
    setFile(picked);
  };

  const submit = async () => {
    if (busy) return;
    if (!channel) return setError('اختر طريقة الدفع التي حوّلت عبرها');
    if (!file) return setError('ارفع صورة إيصال التحويل');
    setError('');
    setBusy(true);
    try {
      const response = await paymentsAPI.uploadReceipt(order.id, file, channel);
      setFile(null);
      onUpdated?.(response.data?.order);
    } catch (err) {
      setError(err.message || 'تعذر رفع الإيصال');
    } finally {
      setBusy(false);
    }
  };

  if (status === 'review') {
    return (
      <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm leading-7 text-blue-900" dir="rtl">
        <p className="font-black">إيصالك قيد المراجعة</p>
        <p className="mt-1">
          استلمنا إيصال التحويل ونتحقق من وصول المبلغ. سيُفعَّل طلبك ويصل للمزودين فور التأكيد، وستصلك رسالة إشعار.
        </p>
        <button
          type="button"
          onClick={() => openReceipt(order.id)}
          className="mt-2 text-xs font-bold underline"
        >
          عرض الإيصال المرفوع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950" dir="rtl">
      <div>
        <p className="font-black text-base">أكمل الدفع لتفعيل طلبك</p>
        <p className="mt-1 leading-7">
          حوّل <strong>{formatIqd(order.price)}</strong> ثم ارفع صورة الإيصال. لن يصل الطلب للمزودين قبل تأكيد الدفع.
        </p>
      </div>

      {order.paymentNote && (
        <p className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-700">
          رُفض الإيصال السابق: {order.paymentNote}
        </p>
      )}

      {isLoading ? (
        <p className="text-gray-500">جاري تحميل طرق الدفع...</p>
      ) : methods.length === 0 ? (
        <p className="rounded-xl bg-white px-3 py-2 font-bold text-gray-600">
          لم تُضف الإدارة طرق الدفع بعد. تواصل معنا وسنزودك بالتفاصيل.
        </p>
      ) : (
        <div className="space-y-2">
          {methods.map((method) => (
            <label
              key={method.id}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border bg-white px-3 py-2 ${
                channel === method.id ? 'border-academic-blue ring-1 ring-academic-blue' : 'border-gray-200'
              }`}
            >
              <input
                type="radio"
                name={`channel-${order.id}`}
                checked={channel === method.id}
                onChange={() => setChannel(method.id)}
              />
              <span className="flex-1">
                <span className="block font-black text-gray-800">{method.label}</span>
                <span dir="ltr" className="block text-right font-mono text-base font-bold text-gray-900">
                  {method.account}
                </span>
                {method.holder && <span className="block text-xs text-gray-500">باسم: {method.holder}</span>}
              </span>
              <CopyButton value={method.account} />
            </label>
          ))}
        </div>
      )}

      <div className="rounded-xl bg-white px-3 py-2 leading-7">
        اكتب رمز الطلب <strong dir="ltr" className="mx-1 rounded bg-gray-100 px-2 py-0.5 font-mono">{order.paymentReference}</strong>
        في ملاحظة التحويل إن أمكن.
        {info?.instructions && <span className="block text-gray-600">{info.instructions}</span>}
      </div>

      <div>
        <label className="mb-1 block font-bold">صورة إيصال التحويل</label>
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={pickFile}
          className="block w-full text-xs file:ml-3 file:rounded-lg file:border-0 file:bg-gray-200 file:px-3 file:py-2 file:font-bold"
        />
        {preview && (
          <img src={preview} alt="معاينة الإيصال" className="mt-2 max-h-48 rounded-xl border border-gray-200 object-contain" />
        )}
      </div>

      {error && <p className="rounded-xl bg-red-50 px-3 py-2 font-bold text-red-600">{error}</p>}

      <button
        type="button"
        disabled={busy || methods.length === 0}
        onClick={submit}
        className="w-full rounded-xl py-3 font-bold text-white disabled:opacity-50"
        style={{ backgroundColor: academicBlue }}
      >
        {busy ? 'جاري رفع الإيصال...' : 'إرسال الإيصال'}
      </button>
    </div>
  );
}

PaymentPanel.propTypes = {
  order: PropTypes.shape({
    id: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    paymentStatus: PropTypes.string,
    paymentReference: PropTypes.string,
    paymentNote: PropTypes.string,
  }),
  onUpdated: PropTypes.func,
};
