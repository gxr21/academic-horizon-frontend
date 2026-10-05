import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
export const ServiceCard = ({ title, desc, icon, animate: AnimateWrapper, link, li  }) => {
    const cardContent = (
        <>
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform inline-block">
                {icon}
            </div>
            <h3 className="text-2xl font-bold text-academic-blue mb-4">{title}</h3>
            <p className="text-gray-500 leading-relaxed">
                {desc}
            </p>
            {li && (
                <ul className="text-gray-500 leading-relaxed">
                    {li}
                </ul>
            )}
            {/* <Link to={link} className="text-academic-blue font-bold mt-4 inline-block hover:underline">تعرف على المزيد</Link> */}
        </>
    );
    return (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-xl 
        hover:shadow-2xl transition-all border-b-4
         border-b-academic-gold group  border-r-academic-gold border-r-4 cursor-pointer overflow-hidden">
            {AnimateWrapper ? (
                <AnimateWrapper sparkColor="#E9C176">
                    <div className="p-8">
                        {cardContent}
                    </div>
                </AnimateWrapper>
            ) : (
                <div className="p-8">
                    {cardContent}
                </div>
            )}
        </div>
    );
};

ServiceCard.propTypes = {
    title: PropTypes.string.isRequired,
    desc: PropTypes.string.isRequired,
    icon: PropTypes.node.isRequired,
    animate: PropTypes.elementType,
    link: PropTypes.string.isRequired,
    li: PropTypes.node,
};

ServiceCard.defaultProps = {
    animate: undefined,
    li: undefined,
};

