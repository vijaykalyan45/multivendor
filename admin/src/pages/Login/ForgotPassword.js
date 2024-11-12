import { useContext, useEffect, useState } from "react";
import Logo from "../../assets/images/logo.png";
import patern from "../../assets/images/pattern.webp";
import { MyContext } from "../../App";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye } from "react-icons/io";
import { IoMdEyeOff } from "react-icons/io";
import Button from "@mui/material/Button";
import { Link } from "react-router-dom";
import axios from "axios";
import googleIcon from "../../assets/images/googleIcon.png";
import { useNavigate } from "react-router-dom";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";

import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";


const ForgotPassword= () => {
  const [inputIndex, setInputIndex] = useState(null);
  const [isShowPassword, setisShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const history = useNavigate();
  const context = useContext(MyContext);

  const [formfields, setFormfields] = useState({
    email: "",
  
  });

  useEffect(() => {
    context.setisHideSidebarAndHeader(true);

    const token = localStorage.getItem("token");
    if (token !== "" && token !== undefined && token !== null) {
   
      setIsLogin(!true);
     
    } else {
      
    }
  }, []);

  const focusInput = (index) => {
    setInputIndex(index);
  };

  const onchangeInput = (e) => {
    setFormfields(() => ({
      ...formfields,
      [e.target.name]: e.target.value,
    }));
  };

  const signIn = (e) => {
    e.preventDefault();

    if (formfields.email === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "email can not be blank!",
      });
      return false;
    }

   

    setIsLoading(true);
    postData("/api/user/password-reset-request-admin", formfields).then((res) => {
      try {
        if (res.error !== true) {
 


      
          context.setAlertBox({
            open: true,
            error: false,
            msg: res.message,
          });
          setIsLoading(false)
          localStorage.setItem("cmail", formfields.email)
setTimeout(() => {
  history("/setPassword"); 
}, 2000);
        //   setTimeout(() => {
        //     history("/");
        //     context.setIsLogin(true);
        //     setIsLoading(false);
        //     context.setisHeaderFooterShow(true);
        //     //window.location.href = "/";
        //   }, 2000);
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.message,
          });

          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    });
  };

 
  
  

  return (
    <>
      <img src={patern} className="loginPatern" />
      <section className="loginSection">
        <div className="loginBox">
          <Link to={"/"} className="d-flex align-items-center flex-column logo">
            {/* <img src={logo3} /> */}
            <span className="ml-2">ECOMMERCE</span>
          </Link>
          <div className="wrapper mt-3 card border">
            <form onSubmit={signIn}>
              <div
                className={`form-group position-relative ${
                  inputIndex === 0 && "focus"
                }`}
              >
                <span className="icon">
                  <MdEmail />
                </span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="enter your email"
                  onFocus={() => focusInput(0)}
                  onBlur={() => setInputIndex(null)}
                  autoFocus
                  name="email"
                  onChange={onchangeInput}
                />
              </div>

              

              <div className="form-group">
                <Button type="submit" className="btn-blue btn-lg w-100 btn-big">
                  {isLoading === true ? <CircularProgress /> : "send otp "}
                </Button>
              </div>

            
            </form>
          </div>

          {/* <div className="wrapper mt-3 card border footer p-3">
            <span className="text-center">
              Don't have an account?
              <Link to={"/setPassword"} className="link color ml-2">
                Register
              </Link>
            </span>
          </div> */}
        </div>
      </section>
    </>
  );
};

export default ForgotPassword;
