import PropTypes from 'prop-types';

const Input = ({ type = 'text', svg, placeholder = '', value, onChange, name = '', id = '', className = '', ...props }) => {
  return (
    <div className="relative flex items-center">
      {svg && <span className="absolute left-3 flex items-center pointer-events-none">{svg}</span>}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
        id={id}
        className={`${className} ${svg ? 'pl-10' : ''}`}
        {...props}
      />
    </div>
  );
};

Input.propTypes = {
  type: PropTypes.string,
  placeholder: PropTypes.string,
  value: PropTypes.string,
  onChange: PropTypes.func,
  name: PropTypes.string,
  id: PropTypes.string,
  className: PropTypes.string,
  svg: PropTypes.element,
};

export default Input;
