import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

const AccountActivation = () => {
  const { token } = useParams(); // Get the token from the URL
  const [message, setMessage] = useState("");
  

  useEffect(() => {
    // Make the request to the server to activate the account
    const activateAccount = async () => {
      try {
        const response = await axios.post("http://localhost.com:8000/api/user/activation", {
          activation_token: token, // Sending the token to the server
        });
        console.log(response);
        
        setMessage(response.data.msg); // Handle success message from server
      } catch (error) {
        console.log(error);
        setMessage("Activation failed: " + error.response.data.message);
      }
    };

    activateAccount();
  }, [token]);

  return (
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"100px 0"}}>
      <h2>Account Activation</h2>
      <p>{message}</p>
    </div>
  );
};

export default AccountActivation;
