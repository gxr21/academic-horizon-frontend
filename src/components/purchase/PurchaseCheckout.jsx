import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { ordersAPI } from '../../lib/api';
import PaymentPanel from './PaymentPanel';

const academicBlue = '#1A5276';

export const parsePrice = (price) => {
  if (typeof price === 'number') return price;
  return parseFloat(String(price ?? '').replace(/[^\d.]/g, '')) || 0;
};

export const formatIqd = (value) => `${Number(value || 0).toLocaleString('ar-IQ')} دينار`;

export default function PurchaseCheckout({ service, onClose }) {
  const navigate = useNavigate();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState(null);

  const price = parsePrice(service.price);

  const handleConfirm = async () => {
    if (!agreed || busy) return;
    setError('');
    setBusy(true);
    try {
      const response = await ordersAPI.create(
        service.serviceId
          ? { serviceId: service.serviceId }
          : {
              title: service.title,
              description: service.desc || service.description || '',
              serviceType: service.serviceType || 'general',
              price,
            }
      );
      const order = response.data?.order;
      if (!order) throw new Error('تعذر إنشاء الطلب');
      setReceipt(order);
    } catch (err) {
      setError(err.message || 'تعذر إنشاء الطلب');
    } finally {
      setBusy(false);
    }
  };

  const goToChat = () => {
    if (!receipt?.id) return;
    navigate('/chat', { state: { orderId: receipt.id, justPurchased: true } });
  };

  return (
    <div className="fixed inset-0 z-[80] bg-black/40 flex items-start sm:items-center justify-center p-4 overflow-y-auto" dir="rtl">
      <div className="bg-white w-full max-w-lg rounded-[2rem] shadow-2xl overflow-hidden my-4">
        <div className="px-6 py-5 text-white" style={{ backgroundColor: academicBlue }}>
          <h2 className="text-xl font-black">{receipt ? 'تم إنشاء طلبك' : 'تأكيد طلب الخدمة'}</h2>
          <p className="text-blue-100/80 text-sm mt-1">
            {receipt ? (price > 0 ? 'الخطوة الأخيرة: الدفع ورفع الإيصال' : 'طلبك بانتظار قبول مزود الخدمة') : 'راجع التفاصيل قبل تأكيد الطلب'}
          </p>
        </div>

        <div className="p-6 space-y-5">
          {!receipt ? (
            <>
              <div className="rounded-2xl bg-gray-50 p-4 space-y-2">
                <p className="text-xs font-bold text-gray-400">الخدمة</p>
                <p className="text-lg font-black text-academic-blue">{service.title}</p>
                {(service.desc || service.description) && (
                  <p className="text-sm text-gray-500">{service.desc || service.description}</p>
                )}
                <p className="text-2xl font-black text-academic-gold pt-2">{price > 0 ? formatIqd(price) : 'السعر بالتفاهم'}</p>
              </div>

              {price > 0 && (
                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm text-amber-900 leading-7">
                  الدفع عبر <strong>تحويل محفظة إلكترونية</strong>: بعد التأكيد ستظهر لك بيانات التحويل، ترسل المبلغ ثم ترفع صورة الإيصال.
                  يُفعَّل الطلب ويصل للمزودين بعد أن نتحقق من وصول المبلغ.
                </div>
              )}

              <label className="flex items-start gap-3 text-sm text-gray-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1"
                />
                <span>
                  أؤكد طلب هذه الخدمة{price > 0 ? ` وسأحوّل ${formatIqd(price)} وأرفع إيصال التحويل` : ''}.
                </span>
              </label>

              {error && <p className="text-sm font-bold text-red-600 bg-red-50 rounded-xl px-4 py-3">{error}</p>}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl border border-gray-200 font-bold text-gray-600"
                >
                  إلغاء
                </button>
                <button
                  type="button"
                  disabled={!agreed || busy}
                  onClick={handleConfirm}
                  className="flex-1 py-3 rounded-xl text-white font-bold disabled:opacity-50"
                  style={{ backgroundColor: academicBlue }}
                >
                  {busy ? 'جاري إنشاء الطلب...' : 'تأكيد الطلب'}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-2xl bg-gray-50 p-4 text-sm space-y-2">
                <p className="font-black text-academic-blue">{receipt.title}</p>
                <p><span className="text-gray-400 font-bold">رقم الطلب:</span> #{receipt.id?.slice(-6)}</p>
                <p><span className="text-gray-400 font-bold">المبلغ:</span> {price > 0 ? formatIqd(receipt.price) : 'بالتفاهم'}</p>
              </div>

              <PaymentPanel order={receipt} onUpdated={(updated) => updated && setReceipt(updated)} />

              <button
                type="button"
                onClick={goToChat}
                className="w-full py-3 rounded-xl text-white font-bold"
                style={{ backgroundColor: academicBlue }}
              >
                {receipt.paymentStatus === 'unpaid' && price > 0 ? 'سأدفع لاحقاً — متابعة إلى المحادثة' : 'متابعة إلى المحادثة'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
PurchaseCheckout.propTypes = {
  service: PropTypes.shape({
    serviceId: PropTypes.string,
    title: PropTypes.string.isRequired,
    desc: PropTypes.string,
    description: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
    serviceType: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
};

