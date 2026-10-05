import PropTypes from 'prop-types';
const Button = ({className, children, onClick, type = 'button', disabled = false , icon }) => {
 return (
    <button
        className={className}
        onClick={onClick}
        type={type}
        disabled={disabled}
        style={{fontFamily: 'tajawal'}}
        dir="rtl" 
    >
        {icon}
        {children}
    </button>
 )
}

Button.propTypes = {
  className: PropTypes.string,
  children: PropTypes.node,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  disabled: PropTypes.bool,
  label: PropTypes.string,
  icon: PropTypes.node,
};

export default Button;