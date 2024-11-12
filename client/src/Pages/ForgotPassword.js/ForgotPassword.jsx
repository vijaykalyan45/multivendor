import { useContext, useEffect, useState } from "react";
import Logo from "../../assets/images/logo.jpg";
import { MyContext } from "../../App";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { Link, useNavigate } from "react-router-dom";
import logo1 from '../../assets/images/CML.jpg'
import GoogleImg from "../../assets/images/googleImg.png";
import CircularProgress from "@mui/material/CircularProgress";
import { postData } from "../../utils/api";

import axios from "axios";
import { getAuth, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { firebaseApp } from "../../firebase";

const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const ForgotPassword = () => {
  const [isLoading, setIsLoading] = useState(false);
  const context = useContext(MyContext);
  const history = useNavigate();

  useEffect(() => {
    context.setisHeaderFooterShow(false);
    
    context.setEnableFilterTab(false);
  }, []);

  const [formfields, setFormfields] = useState({
    email: "",
    password: "",
  });

  const onchangeInput = (e) => {
    setFormfields(() => ({
      ...formfields,
      [e.target.name]: e.target.value,
    }));
  };

  const login = (e) => {
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
    postData("/api/user/password-reset-request", formfields).then((res) => {
      try {
        if (res.error !== true) {
 


      
          context.setAlertBox({
            open: true,
            error: false,
            msg: res.message,
          });
          setIsLoading(false)

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
    <section className="section signInPage">
      <div className="shape-bottom">
        {" "}
        <svg
          fill="#fff"
          id="Layer_1"
          x="0px"
          y="0px"
          viewBox="0 0 1921 819.8"
          style={{ enableBackground: "new 0 0 1921 819.8" }}
        >
          {" "}
          <path
            class="st0"
            d="M1921,413.1v406.7H0V0.5h0.4l228.1,598.3c30,74.4,80.8,130.6,152.5,168.6c107.6,57,212.1,40.7,245.7,34.4 c22.4-4.2,54.9-13.1,97.5-26.6L1921,400.5V413.1z"
          ></path>{" "}
        </svg>
      </div>

      <div className="container">
        <div className="box card p-3 shadow border-0">
          <div className="text-center">
            <img src={logo1} />
          </div>

          <form className="mt-3" onSubmit={login}>
            <h2 className="mb-4">Forgot Password</h2>

            <div className="form-group">
              <TextField
                id="standard-basic"
                label="Email"
                type="email"
                required
                variant="standard"
                className="w-100"
                name="email"
                onChange={onchangeInput}
              />
            </div>
          


            <div className="d-flex align-items-center mt-3 mb-3 ">
              <Button type="submit" className="btn-blue col btn-lg btn-big">
                {isLoading === true ? <CircularProgress /> : "Sign In"}
              </Button>
            
            </div>

         

         
          </form>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
