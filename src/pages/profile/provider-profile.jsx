import { useEffect } from 'react';
import PropTypes from 'prop-types';
import { FaPhone, FaEnvelope, FaCheckCircle, FaClock, FaCog, FaUserCircle } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useOrders } from '../../context/OrderContext';
import { userAPI } from '../../lib/api';
import HeaderHome from '../../components/header/headerHome';

export default function ProviderProfile() {
  const navigate = useNavigate();
  const { user, updateUser } = useAuth();
  const { getCompletedOrdersCount, getActiveOrdersCount } = useOrders();

  useEffect(() => {
    let cancelled = false;
    userAPI.getProfile()
      .then((res) => {
        const fresh = res.data?.user;
        if (!cancelled && fresh) updateUser(fresh);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [updateUser]);
  
  const profile = {
    name: user?.name || 'مزود خدمة',
    role: 'مزود خدمة معتمد',
    bio: user?.bio || 'لم تُضف الإدارة وصفاً تعريفياً بعد.',
    phone: user?.phone || 'لم يُضف رقم الهاتف بعد',
    email: user?.email || '',
  };
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long' })
    : '—';

  const academicBlue = '#1A5276';
  const academicGold = '#E9C176';

  const completedServices = getCompletedOrdersCount(user?.id);
  const activeServices = getActiveOrdersCount(user?.id);

  return (
    <div className="min-h-screen bg-gray-50 font-tajawal overflow-x-hidden" dir="rtl">
      <HeaderHome />

      <main className="w-full px-0 sm:px-4 md:px-8 py-6">
        {/* الحاوية الرئيسية ثابتة بدون ظلال متحركة */}
        <div className="bg-white min-h-[calc(100vh-120px)] rounded-t-[3rem] sm:rounded-[3rem] shadow-md overflow-hidden border border-gray-100 flex flex-col">
          
          {/* بنر علوي ثابت اللون */}
          <div className="h-48 w-full relative" style={{ backgroundColor: academicBlue }}>
             <div className="absolute inset-0 opacity-5"></div>
          </div>

          <div className="px-6 md:px-12 pb-12 flex-1">
            {/* منطقة البروفايل العلوية */}
            <div className="relative -mt-20 flex flex-col md:flex-row items-center md:items-end justify-between gap-8 border-b border-gray-50 pb-10">
              <div className="flex flex-col md:flex-row items-center md:items-end gap-6 text-center md:text-right">
                <div className="w-44 h-44 rounded-[2.5rem] bg-white p-3 shadow-md overflow-hidden border border-gray-50">
                  <div className="w-full h-full bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300">
                    <FaUserCircle className="text-8xl" />
                  </div>
                </div>
                <div className="mb-4">
                  <h1 className="text-4xl font-black text-gray-800 tracking-tight">{profile.name}</h1>
                  <div className="flex items-center justify-center md:justify-start gap-3 mt-2">
                    <span className="px-4 py-1.5 rounded-full text-sm font-bold bg-blue-50 text-academic-blue flex items-center gap-2" style={{ color: academicBlue }}>
                       <FaCheckCircle className="text-xs" /> {profile.role}
                    </span>
                  </div>
                </div>
              </div>

              {/* أزرار الإجراءات - تمت إزالة تأثيرات الـ Hover والـ Scale */}
              <div className="flex gap-4 mb-4">
                <button 
                  onClick={() => navigate('/settings')}
                  className="p-4 bg-gray-100 text-gray-500 rounded-2xl border border-gray-200"
                >
                  <FaCog className="text-2xl" />
                </button>
              </div>
            </div>

            {/* محتوى الصفحة بتنسيق Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-12 gap-12 mt-12">              
              {/* القسم الأيمن (النبذة والمهارات) */}
              <div className="xl:col-span-8 space-y-12">
                <section>
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-academic-blue" style={{ color: academicBlue }}>
                    <div className="w-2 h-8 bg-academic-gold rounded-full" style={{ backgroundColor: academicGold }}></div>
                    نبذة تعريفية
                  </h2>
                  <p className="text-xl text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-8 rounded-[2rem] border border-gray-100/50">
                    {profile.bio}
                  </p>
                </section>
                <section>
                  <h2 className="text-2xl font-black mb-6 flex items-center gap-3 text-academic-blue" style={{ color: academicBlue }}>
                    <div className="w-2 h-8 bg-academic-gold rounded-full" style={{ backgroundColor: academicGold }}></div>
                    معلومات التواصل المباشر
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ContactItem icon={<FaPhone />} label="رقم الهاتف" text={profile.phone} />
                    <ContactItem icon={<FaEnvelope />} label="البريد الإلكتروني" text={profile.email} />
                  </div>
                </section>
              </div>

              {/* القسم الأيسر (الإحصائيات) */}
              <div className="xl:col-span-4 space-y-6">
                <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6">
                   <h3 className="text-xl font-black text-center mb-4" style={{ color: academicBlue }}>إحصائيات الأداء</h3>
                   
                   <StatCard 
                    icon={<FaCheckCircle />} 
                    val={completedServices} 
                    label="مشروع أكاديمي مكتمل" 
                    color="emerald" 
                   />
                   
                   <StatCard 
                    icon={<FaClock />} 
                    val={activeServices} 
                    label="طلبات قيد المعالجة" 
                    color="orange" 
                   />

                   <div className="pt-6 border-t border-gray-100 text-center">
                      <p className="text-gray-400 text-sm font-bold">عضو منذ: {memberSince}</p>
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// مكونات فرعية ثابتة (بدون Hover Effects)
const ContactItem = ({ icon, label, text }) => (
  <div className="flex items-center gap-5 p-6 bg-white rounded-3xl border border-gray-100 cursor-default">
    <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-2xl text-academic-blue shadow-inner" style={{ color: '#1A5276' }}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-bold text-gray-400 uppercase mb-1">{label}</p>
      <p className="text-lg font-black text-gray-700">{text}</p>
    </div>
  </div>
);

ContactItem.propTypes = {
  icon: PropTypes.node.isRequired,
  label: PropTypes.string.isRequired,
  text: PropTypes.string.isRequired
};

const StatCard = ({ icon, val, label, color }) => {
  const colors = {
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
    orange: "bg-orange-50 text-orange-600 border-orange-100"
  };
  return (
    <div className={`p-8 rounded-[2rem] border ${colors[color]} flex flex-col items-center justify-center text-center`}>
      <div className="text-3xl mb-3">{icon}</div>
      <p className="text-4xl font-black mb-1">{val}</p>
      <p className="font-bold text-sm opacity-80">{label}</p>
    </div>
  );
};

StatCard.propTypes = {
  icon: PropTypes.node.isRequired,
  val: PropTypes.number.isRequired,
  label: PropTypes.string.isRequired,
  color: PropTypes.oneOf(['emerald', 'orange']).isRequired
};
