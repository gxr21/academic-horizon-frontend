import Button from "../buttons/button.jsx";
import { Link } from "react-router-dom";
const academicFont = 'Tajawal';
const Header = () =>{
    // const [signin , setSignin] = useState(false);
    const links = [
        {name: "الرئيسية", path: "/"},
        {name: "حول  الموقع", path: "/about"},
        {name: "خدماتنا", path: "/services"},
        {name: "الاسعار", path: "/price"},
        {name: "المساعدة", path: "/help"},
    ]
    // const handleClick = () =>{
    //     setSignin(!signin);
    // }
    return(
        <header className="bg-white text-academic-blue p-6 shadow-lg">
            <div className="container mx-auto flex justify-between items-center">
                <div className="flex flex-row gap-2">
                    <div className="text-2xl font-bold" style={{fontFamily: academicFont}}>الارشاد الاكاديمي</div>
                <div>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="size-6 text-academic-blue">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
                  </svg>
                </div>
                </div>
                <nav>
                    <ul className="flex space-x-6 justify-center items-center gap-4">
                        {links.map((links,index)=>
                            <li key={index} className="hover:text-academic-gold font-bold transition-colors duration-300" style={{fontFamily: academicFont}}>
                                <Link to={links.path}>{links.name}</Link>
                            </li>
                        )}
                    </ul>
                </nav>
                <div className="flex flex-col gap-4">
                    <Button
                     className="bg-academic-blue w-[100px] h-[40px] text-white px-4 py-2 rounded hover:bg-academic-blue-dark transition-colors duration-300"
                     style={{fontFamily: academicFont}}
                    >
                    
                    <Link to="/login">
                       ابدأ الان
                    </Link>
                    </Button>
                </div>
            </div>
        </header>
    );
}
export default Header;