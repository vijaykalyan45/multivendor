import { useContext, useEffect, useState } from "react";
import { MyContext } from "./App";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import { useNavigate } from "react-router-dom";
import logo1 from './assets/images/CML.jpg';
import CircularProgress from "@mui/material/CircularProgress";
import { postData } from "./utils/api";

const SetPasswordForm = () => {
  const context = useContext(MyContext);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState(() => {
    // Retrieve and parse the user email from localStorage
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user).email : '';
  });

  const [password, setPassword] = useState("");

  useEffect(() => {
    context.setisHeaderFooterShow(false);
    context.setEnableFilterTab(false);
  }, [context]);

  const handleInputChange = (e) => {
    // Update state based on input changes
    const { name, value } = e.target;
    if (name === "password") {
      setPassword(value);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!password) {
      context.setAlertBox({
        open: true,
        error: true,
        msg: "Password cannot be blank!",
      });
      return;
    }

    setIsLoading(true);

    const formData = {
      email,
      password,
    };

    try {
      const res = await postData(`/api/user/setPassword`, formData);
      if (!res.error) {
        context.setAlertBox({
          open: true,
          error: false,
          msg: res.msg,
        });
        setPassword(""); // Clear password field after submission
        setTimeout(() => {
          navigate("/"); // Redirect to home after successful password reset
          context.setIsLogin(true);
          context.setisHeaderFooterShow(true);
        }, 2000);
      } else {
        context.setAlertBox({
          open: true,
          error: true,
          msg: res.msg,
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

  return (
    <section className="section signInPage">
      <div className="shape-bottom">
        <svg
          fill="#fff"
          id="Layer_1"
          x="0px"
          y="0px"
          viewBox="0 0 1921 819.8"
          style={{ enableBackground: "new 0 0 1921 819.8" }}
        >
          <path
            className="st0"
            d="M1921,413.1v406.7H0V0.5h0.4l228.1,598.3c30,74.4,80.8,130.6,152.5,168.6c107.6,57,212.1,40.7,245.7,34.4 c22.4-4.2,54.9-13.1,97.5-26.6L1921,400.5V413.1z"
          />
        </svg>
      </div>

      <div className="container">
        <div className="box card p-3 shadow border-0">
          <div className="text-center">
            <img src={logo1} alt="Logo" />
          </div>

          <form className="mt-3" onSubmit={handleSubmit}>
            <h2 className="mb-4">Set Password</h2>

            <div className="form-group">
              <TextField
                id="password-input"
                label="Password"
                type="password" // Change to password type for security
                required
                variant="standard"
                className="w-100"
                name="password"
                value={password}
                onChange={handleInputChange}
              />
            </div>

            <div className="d-flex align-items-center mt-3 mb-3">
              <Button type="submit" className="btn-blue col btn-lg btn-big">
                {isLoading ? <CircularProgress size={24} /> : "Reset"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default SetPasswordForm;
