import PropTypes from 'prop-types';
import { FaStar, FaPhone, FaEnvelope, FaCheckCircle, FaClock, FaUserCircle, FaTimes } from 'react-icons/fa';

const ProfilePopup = ({ isOpen, onClose, userData, userType }) => {
  const academicBlue = '#1A5276';
  const academicGold = '#E9C176';

  if (!isOpen) return null;

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<FaStar key={i} className="text-lg" style={{ color: academicGold }} />);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<FaStar key={i} className="text-lg opacity-50" style={{ color: academicGold }} />);
      } else {
        stars.push(<FaStar key={i} className="text-gray-200 text-lg" />);
      }
    }
    return stars;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative h-32 rounded-t-3xl" style={{ backgroundColor: academicBlue }}>
          <button 
            onClick={onClose}
            className="absolute top-4 left-4 text-white/80 hover:text-white transition-colors"
          >
            <FaTimes className="text-xl" />
          </button>
        </div>

        {/* Profile Info */}
        <div className="px-6 pb-6 -mt-16">
          <div className="flex justify-center">
            <div className="w-32 h-32 rounded-full bg-white p-2 shadow-xl border-4 border-white">
              <div className="w-full h-full rounded-full bg-gray-100 flex items-center justify-center">
                <FaUserCircle className="text-6xl text-gray-300" />
              </div>
            </div>
          </div>

          <div className="text-center mt-4">
            <h2 className="text-2xl font-black text-gray-800">{userData?.name || 'مستخدم'}</h2>
            <p className="text-gray-500 mt-1">{userType === 'provider' ? 'مزود خدمة معتمد' : 'طالب جامعي'}</p>
            
            {userType === 'provider' && userData?.rating && (
              <div className="flex items-center justify-center gap-1 mt-2">
                {renderStars(userData.rating)}
                <span className="text-amber-600 font-bold mr-2">{userData.rating}</span>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 mt-6">
            <div className="bg-emerald-50 rounded-2xl p-4 text-center border border-emerald-100">
              <FaCheckCircle className="text-emerald-500 text-xl mx-auto mb-2" />
              <p className="text-2xl font-black text-emerald-600">{userData?.completedServices || userData?.completedRequests || 0}</p>
              <p className="text-xs text-emerald-600 font-bold">
                {userType === 'provider' ? 'مشروع مكتمل' : 'طلب مكتمل'}
              </p>
            </div>
            <div className="bg-orange-50 rounded-2xl p-4 text-center border border-orange-100">
              <FaClock className="text-orange-500 text-xl mx-auto mb-2" />
              <p className="text-2xl font-black text-orange-600">{userData?.activeServices || userData?.activeRequests || 0}</p>
              <p className="text-xs text-orange-600 font-bold">
                {userType === 'provider' ? 'طلب نشط' : 'طلب نشط'}
              </p>
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-6 space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FaPhone className="text-academic-blue" style={{ color: academicBlue }} />
              <span className="text-gray-700">{userData?.phone || 'غير متوفر'}</span>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
              <FaEnvelope className="text-academic-blue" style={{ color: academicBlue }} />
              <span className="text-gray-700">{userData?.email || 'غير متوفر'}</span>
            </div>
          </div>

          {/* Bio */}
          {userData?.bio && (
            <div className="mt-6">
              <h3 className="font-bold text-gray-800 mb-2">نبذة تعريفية</h3>
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-xl">
                {userData.bio}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

ProfilePopup.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  userData: PropTypes.object,
  userType: PropTypes.oneOf(['provider', 'student']).isRequired
};

export default ProfilePopup;
