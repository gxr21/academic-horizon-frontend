import { useState } from 'react';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../buttons/button';
import ClickSpark from '../animate/clicker';
import PurchaseCheckout from '../purchase/PurchaseCheckout';

const SubscriptionCard = ({ title, desc, price, onSubscribe, style, id, animate: AnimateWrapper }) => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  const handleSubscribe = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (user?.role !== 'student') {
      alert('شراء الخدمات متاح للطلاب فقط');
      return;
    }
    setCheckoutOpen(true);
  };
  const cardContent = (
    <>
      <div className="absolute inset-0 flex flex-col items-center justify-center p-8  rounded-[30px] shadow-2xl cursor-pointer overflow-hidden 
        border-b-academic-gold group  border-r-academic-gold border-r-4 bg-white hover:transform hover:scale-105 transition-all" style={style}>
        <p className="text-3xl font-semibold mb-4" style={style}>{price}</p>
        <h2 className="text-2xl font-bold  mb-2">{title}</h2>
        <p className=" font-bold text-center mb-6">
          {desc}
        </p>
        {/* <div className={`border rounded-xl border-b-2 w-60 mb-4 ${id === 2 ? 'border-academic-blue' : 'border-academic-gold'}`}></div> */}
        {/* <ul className={`space-y-2  mb-6 text-right w-full ${id === 2 ? 'font-bold' : 'font-normal'}`}>
          <li style={style}>✓ وصول غير محدود</li>
          <li style={style}>✓ دعم على مدار الساعة</li>
          <li style={style}>✓ تحديثات مجانية</li>
        </ul> */}
       
      
      <Button 
        className={`absolute bottom-4 left-1/2 transform -translate-x-1/2 font-bold px-6 py-2 w-[150px] rounded-xl transition-all 
          ${id === 2 ? ' bg-academic-blue text-white  hover:bg-academic-blue hover:text-academic-gold'
           : 'border border-academic-gold text-academic-gold hover:bg-academic-gold hover:text-white'}` }
        onClick={handleSubscribe}
      >
        اطلب الآن
      </Button>
      </div>
    </>
  );

  return (
    <div className="w-full flex items-center justify-center bg-gray-50 p-8">
      <div className="w-[400px] h-[400px] relative">
        {AnimateWrapper ? (
          <AnimateWrapper sparkColor="#E9C176">
            {cardContent}
          </AnimateWrapper>
        ) : (
          cardContent
        )}
      </div>
      {checkoutOpen && (
        <PurchaseCheckout
          service={{ title, desc, price, serviceType: title }}
          onClose={() => setCheckoutOpen(false)}
        />
      )}
    </div>
  );
}

SubscriptionCard.propTypes = {
  title: PropTypes.string.isRequired,
  desc: PropTypes.string.isRequired,
  price: PropTypes.string.isRequired,
  onSubscribe: PropTypes.func,
  style: PropTypes.object,
  id: PropTypes.number,
  animate: PropTypes.elementType,
};

SubscriptionCard.defaultProps = {
  animate: ClickSpark,
};


export default SubscriptionCard;
