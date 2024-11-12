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
const auth = getAuth(firebaseApp);
const googleProvider = new GoogleAuthProvider();

const Login = () => {
  const [inputIndex, setInputIndex] = useState(null);
  const [isShowPassword, setisShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isLogin, setIsLogin] = useState(false);

  const history = useNavigate();
  const context = useContext(MyContext);

  const [formfields, setFormfields] = useState({
    email: "",
    password: "",
    isAdmin: true,
  });

  useEffect(() => {
    context.setisHideSidebarAndHeader(true);

    const token = localStorage.getItem("token");
    if (token !== "" && token !== undefined && token !== null) {
      setIsLogin(true);
      history("/");
    } else {
      history("/login");
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

    if (formfields.password === "") {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "password can not be blank!",
      });
      return false;
    }

    setIsLoading(true);
    postData("/api/user/signin", formfields).then((res) => {
      try {
        if (res.error !== true) {
          localStorage.setItem("token", res.token);

          if (res.user?.isAdmin === true) {
            const user = {
              name: res.user?.name,
              email: res.user?.email,
              userId: res.user?.id,
              isAdmin: res.user?.isAdmin,
            };

            localStorage.removeItem("user");
            localStorage.setItem("user", JSON.stringify(user));

            context.setAlertBox({
              open: true,
              error: false,
              msg: "User Login Successfully!",
            });

            setTimeout(() => {
              context.setIsLogin(true);
              history("/dashboard");
              setIsLoading(false);

            }, 2000);
          } else {
            context.setAlertBox({
              open: true,
              error: true,
              msg: "you are not a admin",
            });
            setIsLoading(false);
          }
        } else {
          context.setAlertBox({
            open: true,
            error: true,
            msg: res.msg,
          });
          setIsLoading(false);
        }
      } catch (error) {
        console.log(error);
        setIsLoading(false);
      }
    });
  };

  const signInWithGoogle = () => {
    setIsLoading(true); // Start loading
    signInWithPopup(auth, googleProvider)
      .then(async (result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);

        const user = result.user;
  
        const fields = {
          email: user.providerData[0].email,
        };
  
        try {

          const response = await postData("/api/user/checkUser", { email: fields.email });
  
          if (response.error) {
            // Handle any server-side errors
            context.setAlertBox({
              open: true,
              error: true,
              msg: response.msg,
            });
            return;
          }
  
          const { exists: userExists, isAdmin, token: serverToken, user: userInfo } = response;
  
          if (userExists) {
            if (isAdmin) {
              // Admin user logic
              context.setAlertBox({
                open: true,
                error: false,
                msg: "Admin Login Successfully!",
              });
  
              // Store user and token in localStorage
              localStorage.setItem("user", JSON.stringify(userInfo));
              localStorage.setItem("token", serverToken); // Store the JWT token
  
              setTimeout(() => {
                context.setIsLogin(true);
                history("/dashboard");
              }, 2000);
            } else {
              // Non-admin user logic
              context.setAlertBox({
                open: true,
                error: true,
                msg: " you are not a admin",
              });
  
              // Store user and token in localStorage if necessary
              localStorage.setItem("user", JSON.stringify(userInfo));
              localStorage.setItem("token", serverToken); // Store the JWT token
            }
          } else {
            // User does not exist
            context.setAlertBox({
              open: true,
              error: true,
              msg: "User not found",
            });
          }
        } catch (error) {
          console.error("Error during check user request:", error);
          context.setAlertBox({
            open: true,
            error: true,
            msg: "An error occurred while checking the user.",
          });
        } finally {
          setIsLoading(false); // Ensure loading state is reset
        }
      })
      .catch((error) => {
        const errorMessage = error.message;
        context.setAlertBox({
          open: true,
          error: true,
          msg: errorMessage,
        });
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

              <div
                className={`form-group position-relative ${
                  inputIndex === 1 && "focus"
                }`}
              >
                <span className="icon">
                  <RiLockPasswordFill />
                </span>
                <input
                  type={`${isShowPassword === true ? "text" : "password"}`}
                  className="form-control"
                  placeholder="enter your password"
                  onFocus={() => focusInput(1)}
                  onBlur={() => setInputIndex(null)}
                  name="password"
                  onChange={onchangeInput}
                />

                <span
                  className="toggleShowPassword"
                  onClick={() => setisShowPassword(!isShowPassword)}
                >
                  {isShowPassword === true ? <IoMdEyeOff /> : <IoMdEye />}
                </span>
              </div>

              <div className="form-group">
                <Button type="submit" className="btn-blue btn-lg w-100 btn-big">
                  {isLoading === true ? <CircularProgress /> : "Sign In "}
                </Button>
              </div>

              <div className="form-group text-center mb-0">
                {/* <Link to={"/forgot-password"} className="link">
                  FORGOT PASSWORD
                </Link> */}
                <div className="d-flex align-items-center justify-content-center or mt-3 mb-3">
                  <span className="line"></span>
                  <span className="txt">or</span>
                  <span className="line"></span>
                </div>

                <Button
                  variant="outlined"
                  className="w-100 btn-lg btn-big loginWithGoogle"
                  onClick={signInWithGoogle}
                >
                  <img src={googleIcon} width="25px" /> &nbsp; Sign In with
                  Google
                </Button>
              </div>
            </form>
          </div>

          {/* <div className="wrapper mt-3 card border footer p-3">
            <span className="text-center">
              Don't have an account?
              <Link to={"/signUp"} className="link color ml-2">
                Register
              </Link>
            </span>
          </div> */}
        </div>
      </section>
    </>
  );
};

export default Login;
