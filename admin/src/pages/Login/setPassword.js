import { useContext, useEffect, useState } from "react";
import Logo from "../../assets/images/logo.png";
import patern from "../../assets/images/pattern.webp";
import { MyContext } from "../../App";
import { MdEmail } from "react-icons/md";
import { RiLockPasswordFill } from "react-icons/ri";
import { IoMdEye, IoMdEyeOff } from "react-icons/io";
import Button from "@mui/material/Button";
import { Link, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import googleIcon from "../../assets/images/googleIcon.png";
import { postData } from "../../utils/api";
import CircularProgress from "@mui/material/CircularProgress";

const SetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const context = useContext(MyContext);

  const [inputIndex, setInputIndex] = useState(null);
  const [isShowPassword, setIsShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formfields, setFormfields] = useState({
    otp: "",
    password: "",
    confirmPassword: ""
  });


  const [email,setEmail] = useState(localStorage.getItem("cmail"));

  useEffect(() => {
    context.setisHideSidebarAndHeader(true);
  }, []);

  const focusInput = (index) => setInputIndex(index);

  const onchangeInput = (e) => {
    setFormfields((prevFields) => ({
      ...prevFields,
      [e.target.name]: e.target.value,
    }));
  };

  const validateFields = () => {
    if (!formfields.confirmPassword) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Email cannot be blank!"
      });
      return false;
    }
    if (!formfields.password) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Password cannot be blank!"
      });
      return false;
    }
    if (formfields.password !== formfields.confirmPassword) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Password and confirm password do not match!"
      });
      return false;
    }
    return true;
  };

  const signIn = async (e) => {
    e.preventDefault();

    if (!validateFields()) return;

    setIsLoading(true);
    try {
      const res = await postData(`/api/user/password-reset-admin`, {
        password: formfields.password,
        email: email
      });

      if (!res.error) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: res.message,
        });
        setTimeout(() => navigate("/login"), 2000);
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: res.message,
        });
      }
    } catch (error) {
      console.error(error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const verify = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const res = await postData(`/api/user/verify-password-reset-otp`, {
        otp: formfields.otp,
        email: email
      });
      console.log(res);
      
console.log(formfields.otp,email);

      context.setAlertBox({
        open: true,
        error: !res.error,
        msg: res.msg
      });
    } catch (error) {
      console.error(error);
      context.setAlertBox({
        open: true,
        error: true,
        msg: "An error occurred. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <img src={patern} className="loginPatern" />
      <section className="loginSection">
        <div className="loginBox">
          <Link to="/" className="d-flex align-items-center flex-column logo">
            <span className="ml-2">ECOMMERCE</span>
          </Link>
          <div className="wrapper mt-3 card border">
            <form onSubmit={signIn}>
              <div className={`form-group position-relative ${inputIndex === 1 && "focus"}`}>
                <span className="icon"><RiLockPasswordFill /></span>
                <input
                  type={isShowPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your OTP"
                  onFocus={() => focusInput(1)}
                  onBlur={() => setInputIndex(null)}
                  name="otp"
                  onChange={onchangeInput}
                />
                <span className="toggleShowPassword" onClick={() => setIsShowPassword(!isShowPassword)}>
                  {isShowPassword ? <IoMdEyeOff /> : <IoMdEye />}
                </span>
              </div>
              
              <div className="form-group">
                <Button onClick={verify} className="btn-blue btn-lg w-100 btn-big">
                  {isLoading ? <CircularProgress /> : "Verify OTP"}
                </Button>
              </div>

              <div className={`form-group position-relative ${inputIndex === 2 && "focus"}`}>
                <span className="icon"><RiLockPasswordFill /></span>
                <input
                  type={isShowPassword ? "text" : "password"}
                  className="form-control"
                  placeholder="Enter your password"
                  onFocus={() => focusInput(2)}
                  onBlur={() => setInputIndex(null)}
                  name="password"
                  onChange={onchangeInput}
                />
                <span className="toggleShowPassword" onClick={() => setIsShowPassword(!isShowPassword)}>
                  {isShowPassword ? <IoMdEyeOff /> : <IoMdEye />}
                </span>
              </div>

              <div className={`form-group position-relative ${inputIndex === 3 && "focus"}`}>
                <span className="icon"><MdEmail /></span>
                <input
                  type="text"
                  className="form-control"
                  placeholder="Confirm password"
                  onFocus={() => focusInput(3)}
                  onBlur={() => setInputIndex(null)}
                  name="confirmPassword"
                  onChange={onchangeInput}
                />
              </div>

              <div className="form-group">
                <Button type="submit" className="btn-blue btn-lg w-100 btn-big">
                  {isLoading ? <CircularProgress /> : "Set Password"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default SetPassword;
