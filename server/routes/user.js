const { User } = require("../models/user");
const { ImageUpload } = require("../models/imageUpload");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const express = require("express");
const router = express.Router();
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const ErrorHandler = require("../utils/ErrorHandler");
const multer = require("multer");
const fs = require("fs");
const sendMail = require("../utils/sendMail");
const crypto = require("crypto");

const cloudinary = require("cloudinary").v2;
const verifyToken = require("../utils/verifyToken");

cloudinary.config({
  cloud_name: process.env.cloudinary_Config_Cloud_Name,
  api_key: process.env.cloudinary_Config_api_key,
  api_secret: process.env.cloudinary_Config_api_secret,
  secure: true,
});

var imagesArr = [];

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}_${file.originalname}`);
    //imagesArr.push(`${Date.now()}_${file.originalname}`)
  },
});

const upload = multer({ storage: storage });

router.post(`/upload`, upload.array("images"), async (req, res) => {
  imagesArr = [];

  try {
    for (let i = 0; i < req?.files?.length; i++) {
      const options = {
        use_filename: true,
        unique_filename: false,
        overwrite: false,
      };

      const img = await cloudinary.uploader.upload(
        req.files[i].path,
        options,
        function (error, result) {
          imagesArr.push(result.secure_url);
          fs.unlinkSync(`uploads/${req.files[i].filename}`);
        }
      );
    }

    let imagesUploaded = new ImageUpload({
      images: imagesArr,
    });

    imagesUploaded = await imagesUploaded.save();
    return res.status(200).json(imagesArr);
  } catch (error) {
    console.log(error);
  }
});

router.post(`/signup`, async (req, res, next) => {
  const { name, phone, email, password, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    const existingUserByPh = await User.findOne({ phone: phone });

    if (existingUser) {
      return res.json({
        status: "FAILED",
        msg: "User already exist with this email!",
      });
    }

    if (existingUserByPh) {
      return res.json({
        status: "FAILED",
        msg: "User already exist with this phone number!",
      });
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const user = {
      name: name,
      phone: phone,
      email: email,
      password: hashPassword,
      isAdmin: isAdmin,
    };
    const activationToken = createActivationToken(user);

    const activationUrl = `https://back-d386a-client.web.app/activation/${activationToken}`;

    try {
      await sendMail({
        email: user.email,
        subject: "Activate your account",
        message: `Hello  ${user.name}, please click on the link to activate your account ${activationUrl} `,
      });
      res.status(201).json({
        success: true,
        msg: `please check your email:- ${user.email} to activate your account!`,
      });
    } catch (err) {
      return next(new ErrorHandler(err.message, 500));
    }
  } catch (error) {
    console.log(error);

    return res.json({ status: "FAILED", msg: "something went wrong" });
  }
});

const createActivationToken = (user) => {
  return jwt.sign(user, process.env.ACTIVATION_SECRET, {
    expiresIn: "5m",
  });
};

router.post('/activation', catchAsyncErrors(async (req, res, next) => {
  try {
    const { activation_token } = req.body;

    const newUser = jwt.verify(activation_token, process.env.ACTIVATION_SECRET);
    if (!newUser) {
      return next(new ErrorHandler('Invalid token', 400));
    }

    const { name, email, password, isAdmin, phone } = newUser;

    let user = await User.findOne({ email });

    if (user) {
      return next(new ErrorHandler('User already exists', 400));
    }

    const result = await User.create({
      name,
      email,
      isAdmin,
      phone,
      password,
    });

    const token = jwt.sign(
      { email: result.email, id: result._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      user: result,
      token: token,
      msg: 'User Register Successfully',
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new ErrorHandler('Token has expired', 400));
    }
    return next(new ErrorHandler(error.message, 500));
  }
}));

router.post("/password-reset-request", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    // Generate password reset token
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: "15m" }
    );

    // Password reset URL
    const resetUrl = `https://back-d386a-client.web.app/passwordReset/${resetToken}`;

    // Send email
    try {
      await sendMail({
        email: user.email,
        subject: "Password Reset Request",
        message: `Please click on the following link to reset your password: ${resetUrl}`,
      });

      res.status(200).json({
        success: true,
        message: `Password reset link sent to ${user.email}. Please check your inbox.`,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error sending the email. Try again later." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});
router.post("/password-reset-request-admin", async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    // Check if the user is an admin
    if (!user.isAdmin) {
      return res
        .status(403)
        .json({ message: "Only admins can request a password reset" });
    }

    // Generate OTP and expiration timestamp (valid for 5 minutes)
    const otp = crypto.randomInt(100000, 999999); // 6-digit OTP
    const otpExpires = Date.now() + 5 * 60 * 1000; // OTP valid for 5 minutes

    // Store OTP and expiration timestamp in the user's document
    user.resetOtp = otp;
    user.resetOtpExpires = otpExpires;
    await user.save();

    // Send OTP email
    try {
      await sendMail({
        email: user.email,
        subject: "Password Reset OTP",
        message: `Your OTP for password reset is: ${otp}. It will expire in 5 minutes.`,
      });

      res.status(200).json({
        success: true,
        message: `OTP sent to ${user.email}. Please check your inbox.`,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ message: "Error sending the email. Try again later." });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/verify-password-reset-otp", async (req, res) => {
  const { email, otp } = req.body;
  console.log(email, otp);

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User with this email does not exist" });
    }

    // Check if OTP matches and is still valid
    if (user.resetOtp !== parseInt(otp) || Date.now() > user.resetOtpExpires) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }

    // Generate a password reset token after OTP verification
    const resetToken = jwt.sign(
      { id: user._id },
      process.env.RESET_PASSWORD_SECRET,
      { expiresIn: "15m" }
    );

    // Clear OTP and expiration fields in the database (optional for security)
    user.resetOtp = null;
    user.resetOtpExpires = null;
    await user.save();

    // Send the reset URL back to the user (or proceed directly)
    const resetUrl = `https://back-d386a-admin.web.app/setPassword/${resetToken}`;
    res.status(200).json({
      success: true,
      message:
        "OTP verified successfully. Please use the link to reset your password.",
      resetUrl,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/password-reset/:token", async (req, res) => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.RESET_PASSWORD_SECRET);

    // Find the user by the ID encoded in the token
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.password = hashPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post("/password-reset-admin", async (req, res) => {
  const { password, email } = req.body;

  try {
    // Verify token

    // Find the user by the ID encoded in the token
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Hash new password
    const hashPassword = await bcrypt.hash(password, 10);

    // Update user's password
    user.password = hashPassword;
    await user.save();

    res.status(200).json({ message: "Password has been reset successfully" });
  } catch (error) {
    console.log(error);
    return res.status(400).json({ message: "Invalid or expired token" });
  }
});

router.post(`/signin`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    if (!existingUser) {
      res.status(404).json({ error: true, msg: "User not found!" });
      return;
    }

    const matchPassword = await bcrypt.compare(password, existingUser.password);

    if (!matchPassword) {
      return res.status(400).json({ error: true, msg: "Invailid credentials" });
    }

    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY,
      { expiresIn: "7d" }
    );

    return res.status(200).send({
      user: existingUser,
      token: token,
      msg: "user Authenticated",
    });
  } catch (error) {
    res.status(500).json({ error: true, msg: "something went wrong" });
    return;
  }
});

router.put(`/changePassword/:id`, async (req, res) => {
  const { name, phone, email, password, newPass, images } = req.body;

  // Check for missing parameters
  if (!email || !password) {
    return res
      .status(400)
      .json({ error: true, msg: "Email and current password are required!" });
  }

  // Find the user by email
  const existingUser = await User.findOne({ email: email });
  if (!existingUser) {
    return res.status(404).json({ error: true, msg: "User not found!" });
  }

  // Check if the current password matches the stored one
  const matchPassword = await bcrypt.compare(password, existingUser.password);
  if (!matchPassword) {
    return res
      .status(400)
      .json({ error: true, msg: "Current password is incorrect!" });
  }

  // Hash new password if provided, otherwise use the existing password
  let newPassword;
  if (newPass) {
    newPassword = bcrypt.hashSync(newPass, 10); // Hash the new password
  } else {
    newPassword = existingUser.password; // Use existing password if newPass is not provided
  }

  // Update the user
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        name: name,
        phone: phone,
        email: email,
        password: newPassword, // Save the new password (or the old one)
        images: images,
      },
      { new: true }
    );

    if (!user) {
      return res
        .status(400)
        .json({ error: true, msg: "User could not be updated!" });
    }

    return res
      .status(200)
      .json({ error: false, msg: "password changed successfully" }); // Return the updated user
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ error: true, msg: "Server error, please try again!" });
  }
});

router.get(`/`, async (req, res) => {
  const userList = await User.find();

  if (!userList) {
    res.status(500).json({ success: false });
  }
  res.send(userList);
});

router.get("/:id", async (req, res) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    res
      .status(500)
      .json({ message: "The user with the given ID was not found." });
  } else {
    res.status(200).send(user);
  }
});

router.delete("/:id", (req, res) => {
  User.findByIdAndDelete(req.params.id)
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else {
        return res
          .status(404)
          .json({ success: false, message: "user not found!" });
      }
    })
    .catch((err) => {
      return res.status(500).json({ success: false, error: err });
    });
});

router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();

  if (!userCount) {
    res.status(500).json({ success: false });
  }
  res.send({
    userCount: userCount,
  });
});

router.post(`/authWithGoogle`, async (req, res) => {
  const { name, phone, email, password, images, isAdmin } = req.body;

  try {
    const existingUser = await User.findOne({ email: email });
    console.log(existingUser, "   existing user check");

    if (!existingUser) {
      const result = await User.create({
        name: name,
        phone: phone,
        email: email,
        password: password,
        images: images,
        isAdmin: isAdmin,
      });
      console.log(result, "   new usercreated");

      const token = jwt.sign(
        { email: result.email, id: result._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY,
        { expiresIn: "7d" }
      );

      return res.status(200).send({
        user: result,
        token: token,
        msg: "User Register Successfully!",
      });
    } else {
      const existingUser = await User.findOne({ email: email });
      const token = jwt.sign(
        { email: existingUser.email, id: existingUser._id },
        process.env.JSON_WEB_TOKEN_SECRET_KEY,
        { expiresIn: "7d" }
      );
      console.log(existingUser, "   existing user data sent");
      return res.status(200).send({
        user: existingUser,
        token: token,
        msg: "User Login Successfully!",
      });
    }
  } catch (error) {
    console.log(error);
  }
});

router.post("/checkUser", async (req, res) => {
  const { email } = req.body;

  try {
    // Find user by email
    const existingUser = await User.findOne({ email: email });

    if (!existingUser) {
      // If user does not exist
      return res.status(404).send({
        msg: "User not found",
        exists: false,
        isAdmin: false,
      });
    }

    // Generate a token using your preferred structure
    const token = jwt.sign(
      { email: existingUser.email, id: existingUser._id },
      process.env.JSON_WEB_TOKEN_SECRET_KEY
    );

    // Send the response including the token and user details
    return res.status(200).send({
      msg: "User found",
      exists: true,
      isAdmin: existingUser.isAdmin,
      token, // Include the token in the response
      user: {
        name: existingUser.name,
        email: existingUser.email,
        userId: existingUser._id,
        isAdmin: existingUser.isAdmin,
      },
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({
      msg: "Server error",
      error: error.message,
    });
  }
});

router.post("/setPassword", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }

    // Hash the password before saving
    user.password = await bcrypt.hash(password, 10);
    // user.googleUser = false; // Now, this user has a password set
    await user.save();

    res.status(200).send({ msg: "Password set successfully!" });
  } catch (error) {
    console.error(error);
    res.status(500).send({ msg: "Server error" });
  }
});

router.put("/:id", async (req, res) => {
  const { name, phone, email } = req.body;

  const userExist = await User.findById(req.params.id);

  if (req.body.password) {
    newPassword = bcrypt.hashSync(req.body.password, 10);
  } else {
    newPassword = userExist.passwordHash;
  }

  const user = await User.findByIdAndUpdate(
    req.params.id,
    {
      name: name,
      phone: phone,
      email: email,
      password: newPassword,
      images: imagesArr,
    },
    { new: true }
  );

  if (!user) return res.status(400).send("the user cannot be Updated!");

  res.send(user);
});

router.post("/check-password", async (req, res) => {
  const { email } = req.query; // Using query parameters to get email

  try {
    // Find the user by their email
    const user = await User.findOne({ email: email });

    if (!user) {
      return res
        .status(404)
        .send({ msg: "User not found", hasPassword: false });
    }

    // Check if the user has a password
    if (user.password) {
      return res
        .status(200)
        .send({ hasPassword: true, msg: "User has a password set" });
    } else {
      return res
        .status(200)
        .send({ hasPassword: false, msg: "User does not have a password set" });
    }
  } catch (error) {
    res.status(500).send({ msg: "Server error", er: error });
  }
});
// router.put('/:id',async (req, res)=> {

//     const { name, phone, email, password } = req.body;

//     const userExist = await User.findById(req.params.id);

//     let newPassword

//     if(req.body.password) {
//         newPassword = bcrypt.hashSync(req.body.password, 10)
//     } else {
//         newPassword = userExist.passwordHash;
//     }

//     const user = await User.findByIdAndUpdate(
//         req.params.id,
//         {
//             name:name,
//             phone:phone,
//             email:email,
//             password:newPassword,
//             images: imagesArr,
//         },
//         { new: true}
//     )

//     if(!user)
//     return res.status(400).send('the user cannot be Updated!')

//     res.send(user);
// })

router.delete("/deleteImage", async (req, res) => {
  const imgUrl = req.query.img;

  // console.log(imgUrl)

  const urlArr = imgUrl.split("/");
  const image = urlArr[urlArr.length - 1];

  const imageName = image.split(".")[0];

  const response = await cloudinary.uploader.destroy(
    imageName,
    (error, result) => {
      // console.log(error, res)
    }
  );

  if (response) {
    res.status(200).send(response);
  }
});
router.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500; // Default to 500 if no status code

  
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    msg: message,
  });
});
module.exports = router;
