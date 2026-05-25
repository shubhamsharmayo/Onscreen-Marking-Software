import { useEffect, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { useDispatch } from "react-redux";
import { login } from "../../store/authSlice";
import ForgotPassword from "./ForgotPassword";
import { FaEye, FaEyeSlash, FaUser } from "react-icons/fa";
import logo from "./omr_logo.png";
import MosLogo from "components/MosLogo";
import { ArrowLeft, Eye, EyeOff, Loader2, Lock, Mail } from "lucide-react";

export function SignIn() {
  const [otp, setOtp] = useState(false);
  const [user, setUser] = useState({
    email: "",
    password: "",
    type: "",
    otp: "",
  });
  const [currentStep, setCurrentStep] = useState("email");
  const [emailError, setEmailError] = useState("");
  const [otpEmail, setOtpEmail] = useState("");
  const [forgotPassword, setForgotPassword] = useState(false);
  const [open, setOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [verify, setVerify] = useState(false);
  const [loginLocked, setLoginLocked] = useState(false);
  const [fingerprintTemplate, setFingerprintTemplate] = useState(
    "Rk1SACAyMAAAAAFcAAABLAGQAMUAxQEAAABdNUDnAChoAEC9ACpsAECvADNzAECUADT7AEDFADvsAEDKAEvnAEDAAFJxAIBaAFuMAEECAF9fAEDBAGDqAEBVAGUKAEDeAGpoAIBRAG2OAECdAHJ7AED6AHVfAEBRAIeWAEAQAI2kAECNAJGDAEBBAJWdAEDRAJtoAEARAJ4fAECVAKiHAICrALV5AIEJALfRAEBoAManAEB1AMqoAECDAM+zAEEfANDNAIDHANnGAEEHAN3KAEBIAOW4AICxAO5QAEEkAPFNAIDOAPU4AEDmAPizAEBWAPzHAEEIAQK7AIDqAQiuAEDIAQuWAEA1ARXKAID3AR6vAECoAR54AIDMASKYAEBVASTbAICqATIGAEAmATTRAECUATdxAED7AT2nAECyAUOGAICMAUb5AEBkAVLoAEBrAV1oAECMAV5zAAAA"
  );
  const [isScanning, setIsScanning] = useState(true);
  const [isCaptured, setIsCaptured] = useState(false);

  const navigate = useNavigate();

  const [otpdata, setOtpsdata] = useState(["", "", "", "", "", ""]);

  // useEffect(() => {
  //   setUser({
  //     email: "",
  //     password: "",
  //     type: "",
  //   });
  // }, [otp]);

  // const handleSubmitEmailPassword = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   if (localStorage.getItem("token")) localStorage.removeItem("token");
  //   const updatedUser = { ...user, type: "fingerprint" };
  //   try {
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/auth/signin`,
  //       updatedUser
  //     );
  //     toast.success("Logged in successfully!");
  //     dispatch(login(response.data));
  //     navigate("/admin");
  //   } catch (error) {
  //     // toast.error(error?.response?.data?.message);
  //     // console.log(error?.response?.data?.message);

  //     if (error?.response?.status === 403) {
  //       const message = error?.response?.data?.message;
  //       toast.error(message);

  //       // Optional: disable login for locked user
  //       setLoginLocked(true);
  //     } else {
  //       toast.error(error?.response?.data?.message || "Login failed");
  //     }
  //     setUser({
  //       email: user.email,
  //       password: user.password,
  //       type: user.type,
  //     });
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmitEmailPassword = async (e) => {
    e.preventDefault();

    if (!user.email) {
      toast.error("Enter email");
      return;
    }

    if (!fingerprintTemplate) {
      toast.error("Place finger on scanner");
      return;
    }

    setLoading(true);

    const payload = {
      email: user.email,
      type: "fingerprint",
      fingerprintTemplate:
        fingerprintTemplate ||
        "Rk1SACAyMAAAAAFcAAABLAGQAMUAxQEAAABdNUDnAChoAEC9ACpsAECvADNzAECUADT7AEDFADvsAEDKAEvnAEDAAFJxAIBaAFuMAEECAF9fAEDBAGDqAEBVAGUKAEDeAGpoAIBRAG2OAECdAHJ7AED6AHVfAEBRAIeWAEAQAI2kAECNAJGDAEBBAJWdAEDRAJtoAEARAJ4fAECVAKiHAICrALV5AIEJALfRAEBoAManAEB1AMqoAECDAM+zAEEfANDNAIDHANnGAEEHAN3KAEBIAOW4AICxAO5QAEEkAPFNAIDOAPU4AEDmAPizAEBWAPzHAEEIAQK7AIDqAQiuAEDIAQuWAEA1ARXKAID3AR6vAECoAR54AIDMASKYAEBVASTbAICqATIGAEAmATTRAECUATdxAED7AT2nAECyAUOGAICMAUb5AEBkAVLoAEBrAV1oAECMAV5zAAAA",
    };

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signin`,
        payload
      );
      localStorage.setItem("role", response?.data?.role);

      toast.success("Logged in successfully!");
      dispatch(login(response.data));
      navigate("/admin");
    } catch (error) {
      toast.error(error?.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOtpPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    const updatedUser = { ...user, type: "otp" };
    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/signin`,
        updatedUser
      );
      toast.success(response?.data?.message);
      localStorage.setItem("userId", response?.data?.userId);
      localStorage.setItem("role", response?.data?.role);
    } catch (error) {
      toast.error(error?.response?.data?.message);
      setUser({
        email: "",
        password: "",
        type: "",
        otp: "",
      });
    } finally {
      setLoading(false);
    }
  };

  // const sendForgotOtp = async () => {
  //   // if (!user.email) {
  //   //   toast.error("Email is required");
  //   //   return;
  //   // }

  //   if (!user.email) {
  //     toast.error("Email is required");
  //     return;
  //   }

  //   if (!isValidEmail(user.email)) {
  //     toast.error("Please enter a valid email address");
  //     return;
  //   }

  //   try {
  //     setLoading(true);

  //     // 🔐 freeze email for OTP verification step
  //     setOtpEmail(user.email);

  //     const res = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/auth/send-otp`,
  //       { email: user.email }
  //     );

  //     toast.success(res.data.message || "OTP sent successfully");

  //     setOtpEmail(user.email); // ⭐ freeze email here
  //     setOtp(true);
  //     setCurrentStep("otp");
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message || "Failed to send OTP");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const sendForgotOtp = async () => {
    if (!user.email) {
      toast.error("Email is required");
      return;
    }

    if (!isValidEmail(user.email)) {
      toast.error("Please enter valid email");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/send-otp`,
        { email: user.email }
      );

      // ⭐⭐ BACKEND RESPONSE HANDLING ⭐⭐
      if (res?.data?.status === false) {
        toast.error("Email not registered");
        setOtp(false);
        return;
      }

      // ⭐ IF USER EXISTS
      if (res?.data?.status === true) {
        toast.success(res?.data?.message || "OTP Sent Successfully");

        setOtpEmail(user.email); // freeze email
        setOtp(true);
        setCurrentStep("otp"); // move ONLY when true
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let interval;

    if (isScanning && !isCaptured) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("https://localhost:8443/SGIFPCapture", {
            method: "POST",
            headers: {
              "Content-Type": "text/plain;charset=UTF-8",
            },
            body: "Timeout=10000&Quality=50&licstr=&templateFormat=ISO&imageWSQRate=0.75",
          });

          const text = await response.text();
          const data = JSON.parse(text);

          if (data.ErrorCode === 0 && data.ISOTemplateBase64) {
            // ✅ Capture ONLY ONCE
            setFingerprintTemplate(data.ISOTemplateBase64);

            setIsCaptured(true); // 🛑 stop further updates
            setIsScanning(false); // 🛑 stop scanning

            console.log("Fingerprint captured ONCE ✅");
          }
        } catch (err) {
          // silent
        }
      }, 2000); // faster response
    }

    return () => clearInterval(interval);
  }, [isScanning, isCaptured]);

  useEffect(() => {
    if (user.email) {
      setFingerprintTemplate(
        "Rk1SACAyMAAAAAFcAAABLAGQAMUAxQEAAABdNUDnAChoAEC9ACpsAECvADNzAECUADT7AEDFADvsAEDKAEvnAEDAAFJxAIBaAFuMAEECAF9fAEDBAGDqAEBVAGUKAEDeAGpoAIBRAG2OAECdAHJ7AED6AHVfAEBRAIeWAEAQAI2kAECNAJGDAEBBAJWdAEDRAJtoAEARAJ4fAECVAKiHAICrALV5AIEJALfRAEBoAManAEB1AMqoAECDAM+zAEEfANDNAIDHANnGAEEHAN3KAEBIAOW4AICxAO5QAEEkAPFNAIDOAPU4AEDmAPizAEBWAPzHAEEIAQK7AIDqAQiuAEDIAQuWAEA1ARXKAID3AR6vAECoAR54AIDMASKYAEBVASTbAICqATIGAEAmATTRAECUATdxAED7AT2nAECyAUOGAICMAUb5AEBkAVLoAEBrAV1oAECMAV5zAAAA"
      );
      setIsCaptured(false);
      setIsScanning(true);
    }
  }, [user.email]);

  const isValidEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[A-Za-z]{2,}$/;
    return emailRegex.test(email);
  };

  // const verifyForgotOtp = async () => {
  //   const otpValue = otpdata.join("");

  //   if (otpValue.length !== 6) {
  //     toast.error("Enter valid 6-digit OTP");
  //     return;
  //   }

  //   try {
  //     setVerify(true);
  //     const res = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
  //       {
  //         email: otpEmail, // ⭐⭐⭐ THIS LINE FIXES YOUR 400 ERROR
  //         otp: otpValue,
  //       }
  //     );

  //     toast.success(res.data.message || "OTP verified successfully");
  //     setOpen(true); // ⭐ open reset password modal // open reset password modal
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message || "Invalid OTP");
  //   } finally {
  //     setVerify(false);
  //   }
  // };

  const verifyForgotOtp = async () => {
    const otpValue = otpdata.join("");

    if (otpValue.length !== 6) {
      toast.error("Enter valid 6-digit OTP");
      return;
    }

    try {
      setVerify(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify-otp`,
        {
          email: otpEmail,
          otp: otpValue,
        }
      );

      toast.success(res.data.message || "OTP verified successfully");

      setCurrentStep("reset"); // ⭐ OPEN PASSWORD MODAL HERE
    } catch (error) {
      toast.error(error?.response?.data?.message || "Invalid OTP");
    } finally {
      setVerify(false);
    }
  };

  // const resetPassword = async () => {
  //   if (!newPassword || !confirmPassword) {
  //     toast.error("All fields are required");
  //     return;
  //   }

  //   if (newPassword.length < 8) {
  //     toast.error("Password must be at least 8 characters");
  //     return;
  //   }

  //   if (newPassword !== confirmPassword) {
  //     toast.error("Passwords do not match");
  //     return;
  //   }

  //   try {
  //     setLoading(true);
  //     const res = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
  //       {
  //         email: otpEmail,
  //         password: newPassword,
  //         confirmPassword,
  //       }
  //     );

  //     toast.success(res.data.message || "Password reset successfully");

  //     // cleanup + redirect
  //     setOpen(false);
  //     setForgotPassword(false);
  //     setOtp(false);
  //     setUser({ email: "", password: "", otp: "" });
  //   } catch (error) {
  //     toast.error(error?.response?.data?.message || "Reset failed");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Helper function to handle input changes

  const resetPassword = async () => {
    if (!newPassword || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/reset-password`,
        {
          email: otpEmail,
          password: newPassword,
          confirmPassword: confirmPassword,
        }
      );

      toast.success("Password Reset Successfully");

      // go back to login
      setCurrentStep("email");
      setForgotPassword(false);
      setOtp(false);
      setOtpEmail("");
      setNewPassword("");
      setConfirmPassword("");
      setOtpsdata(["", "", "", "", "", ""]);
    } catch (error) {
      toast.error(error?.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (value, index) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otpdata];
      newOtp[index] = value;
      setOtpsdata(newOtp);
      setUser({ ...user, otp: otpdata.join("") });
    }
  };

  // Helper function to handle navigation between input fields
  const handleKeyUp = (e, index) => {
    if (e?.key === "Backspace" && !otpdata[index] && index > 0) {
      e?.target.previousElementSibling?.focus();
    } else if (e?.key !== "Backspace" && index < 5) {
      e?.target.nextElementSibling?.focus();
    }
  };

  const verifyOTP = async () => {
    setVerify(true);
    const userId = localStorage.getItem("userId");

    if (otpdata?.some((digit) => digit === "")) {
      toast.error("Please fill all OTP fields");
      setVerify(false);
      return;
    }

    const otpString = otpdata?.join(""); // Combine individual OTP values into a string

    try {
      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/verify`,
        { userId, otp: otpString }
      );
      toast.success(response?.data?.message);
      if (localStorage.getItem("token")) localStorage.removeItem("token");
      localStorage.setItem("token", response?.data?.token);
      if (!forgotPassword) {
        navigate("/admin");
      } else {
        setOpen(!open);
      }
    } catch (error) {
      toast.error(error?.response?.data?.message);
    } finally {
      setVerify(false);
    }
  };

  return (
    <>
      {/* Glassmorphism card */}
      <div className="relative rounded-3xl border border-white/40 bg-white/70 p-8 shadow-2xl backdrop-blur-xl md:p-12">
        {forgotPassword ? (
          <>
            {/* Back button */}
            {currentStep !== "success" && (
              <motion.button
                onClick={() => {
                  setForgotPassword(false);
                  // setOtp(false);
                  setCurrentStep("email");
                  setOtpsdata(["", "", "", "", "", ""]);
                }}
                className="text-slate-600 hover:text-slate-900 mb-6 flex items-center gap-2 transition-colors"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
              >
                <ArrowLeft size={20} />
                <span className="font-medium">Back to Login</span>
              </motion.button>
            )}

            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MosLogo />
            </motion.div>

            {/* Progress steps */}
            {currentStep !== "success" && (
              <div className="mb-8 flex justify-center">
                <div className="flex items-center gap-3">
                  {["email", "send otp", "otp"].map((step, index) => {
                    const stepIndex = ["email", "otp", "reset"].indexOf(
                      currentStep
                    );
                    const isActive = stepIndex >= index;

                    return (
                      <div key={step} className="flex items-center gap-3">
                        <motion.div
                          className={`h-3 w-3 rounded-full transition-all duration-300 ${
                            isActive
                              ? "scale-125 bg-gradient-to-r from-blue-500 to-purple-500"
                              : "bg-slate-300"
                          }`}
                          initial={{ scale: 0 }}
                          animate={{ scale: isActive ? 1.25 : 1 }}
                          transition={{ delay: 0.5 + index * 0.1 }}
                        />
                        {index < 2 && (
                          <div
                            className={`h-0.5 w-12 transition-all duration-300 ${
                              stepIndex > index
                                ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                : "bg-slate-300"
                            }`}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Logo */}
            <motion.div
              className="mb-8 flex justify-center"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <MosLogo />
            </motion.div>

            {/* Title */}
            <motion.div
              className="mb-8 text-center"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <h1 className="text-transparent mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-3xl font-semibold md:text-4xl">
                Welcome Back
              </h1>
              <p className="text-slate-600">Sign in to continue your journey</p>
            </motion.div>
          </>
        )}

        <div className="max-w-xl lg:max-w-3xl">
          <h1 className="animate-bounceCustom text-center font-poppins text-2xl font-bold text-indigo-600 sm:text-3xl md:text-3xl">
            {forgotPassword ? (
              "Forgot Password"
            ) : (
              <div>{/* Hello, <br /> Welcome Back */}</div>
            )}
          </h1>
          {forgotPassword ? (
            <p className="mt-4 leading-relaxed text-gray-700">
              Enter your registered email to receive OTP
            </p>
          ) : (
            <p className="mt-4 text-center leading-relaxed text-gray-700">
              Enter your email address and password.{" "}
              {/* or OTP to access the admin
              panel. */}
            </p>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Login */}
            {currentStep === "email" && (
              <form className="space-y-6" onSubmit={handleSubmitEmailPassword}>
                {/* Email input */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 }}
                >
                  <label
                    htmlFor="email"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Email ID
                  </label>

                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Mail size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={user.email}
                      required
                      onChange={(e) =>
                        setUser({ ...user, email: e.target.value })
                      }
                      className={`border-slate-200 focus:border-blue-400focus:bg-white w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-4 outline-none backdrop-blur-sm transition-all duration-300 focus:shadow-lg`}
                      placeholder="you@example.com"
                    />
                  </div>
                </motion.div>

                {/* Fingerprint Status UI */}
                <div className="mt-4 flex flex-col items-center gap-2">
                  {isScanning && !isCaptured && (
                    <p className="text-md animate-pulse text-yellow-600">
                      Enter Email and place your finger on scanner...
                    </p>
                  )}

                  {isCaptured && fingerprintTemplate && (
                    <p className="text-sm font-medium text-green-600">
                      Fingerprint Captured ✓
                    </p>
                  )}
                </div>
                {/* Password input */}
                {/* <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                >
                  <label
                    htmlFor="password"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Password
                  </label>

                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Lock size={20} />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      value={user.password}
                      required
                      onChange={(e) =>
                        setUser({ ...user, password: e.target.value })
                      }
                      className={`border-slate-200 w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-12 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg`}
                      placeholder="••••••••"
                    />
                    <span
                      onClick={() => setShowPassword(!showPassword)}
                      className="text-slate-400 hover:text-slate-600 absolute right-4 top-1/2 -translate-y-1/2 transform transition-colors"
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </span>
                  </div>
                </motion.div> */}

                {/* Forgot password link */}
                <motion.div
                  className="flex justify-end"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setForgotPassword(true);
                      // setOtp(true);
                      setCurrentStep("send otp");
                      setOtpsdata(["", "", "", "", "", ""]);
                    }}
                    className="text-sm font-medium text-blue-600 transition-colors hover:text-purple-600"
                  >
                    Forgot Password?
                  </button>
                </motion.div>

                {/* Login button */}
                <motion.button
                  type="submit"
                  disabled={loading || loginLocked}
                  className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.9 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="animate-spin" size={20} />
                      Signing In...
                    </span>
                  ) : (
                    "Sign In"
                  )}
                </motion.button>
              </form>
            )}

            {/* Step 2: Send OTP */}
            {currentStep === "send otp" && (
              <form className="space-y-6" onSubmit={handleSubmitOtpPassword}>
                <div className="space-y-6">
                  <label
                    htmlFor="email"
                    className="text-slate-700 mb-2 block text-sm font-medium"
                  >
                    Registered Email ID
                  </label>
                  <div className="relative">
                    <div className="text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 transform">
                      <Mail size={20} />
                    </div>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      // onChange={(e) =>
                      //   setUser({ ...user, email: e?.target?.value })
                      // }
                      onChange={(e) => {
                        const value = e.target.value;
                        setUser({ ...user, email: value });

                        if (!value) {
                          setEmailError("");
                        } else if (!isValidEmail(value)) {
                          setEmailError("Invalid email format");
                        } else {
                          setEmailError("");
                        }
                      }}
                      value={user?.email}
                      className="border-slate-200 w-full rounded-2xl border-2 bg-white/60 py-4 pl-12 pr-4 outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg"
                      placeholder="you@example.com"
                    />
                  </div>

                  {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                  )}

                  <motion.button
                    type="button"
                    onClick={() => {
                      if (forgotPassword) {
                        sendForgotOtp();
                      } else {
                        handleSubmitOtpPassword();
                      }
                      // setCurrentStep("otp");
                    }}
                    disabled={loading || emailError}
                    className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Sending OTP...
                      </span>
                    ) : (
                      "Send OTP"
                    )}
                  </motion.button>
                </div>
              </form>
            )}

            {/* Step 3: OTP Verification */}
            {currentStep === "otp" && (
              <motion.div
                key="otp"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="text-transparent mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-3xl font-semibold md:text-4xl">
                    Verify OTP
                  </h1>
                  <p className="text-slate-600">
                    We've sent a 6-digit code to
                    <br />
                    <span className="text-slate-700 font-medium">
                      {otpEmail}
                    </span>
                  </p>
                </div>

                <div className="space-y-6">
                  {/* OTP Input */}
                  <div>
                    <label className="text-slate-700 mb-4 block text-center text-sm font-medium">
                      Enter OTP
                    </label>
                    <div className="flex justify-center gap-2 md:gap-3">
                      {otpdata.map((digit, index) => (
                        <input
                          key={index}
                          id={`otp-${index}`}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(e.target.value, index)}
                          onKeyUp={(e) => handleKeyUp(e, index)}
                          className="border-slate-200 h-14 w-12 rounded-2xl border-2 bg-white/60 text-center text-xl font-semibold outline-none backdrop-blur-sm transition-all duration-300 focus:border-blue-400 focus:bg-white focus:shadow-lg md:h-16 md:w-14"
                        />
                      ))}
                    </div>
                    {/* {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 text-sm text-red-500 text-center"
                      >
                        {error}
                      </motion.p>
                    )} */}
                  </div>

                  <motion.button
                    type="button"
                    onClick={forgotPassword ? verifyForgotOtp : verifyOTP}
                    disabled={loading}
                    className="w-full transform rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-xl active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <Loader2 className="animate-spin" size={20} />
                        Verifying OTP...
                      </span>
                    ) : (
                      "Verify OTP"
                    )}
                  </motion.button>

                  {forgotPassword ? null : (
                    <p className="text-sm font-medium text-blue-600 transition-colors hover:text-purple-600">
                      <button
                        onClick={() => {
                          setOtp(!otp);
                          setCurrentStep("email");
                        }}
                        className="mt-5 text-indigo-600"
                        cursor="pointer"
                        disabled={verify}
                      >
                        Password based login
                      </button>
                    </p>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 4: RESET PASSWORD */}
            {currentStep === "reset" && (
              <motion.div
                key="reset"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="mb-8 text-center">
                  <h1 className="text-transparent mb-2 bg-gradient-to-r from-blue-600 via-purple-600 to-teal-600 bg-clip-text text-3xl font-semibold md:text-4xl">
                    Reset Password
                  </h1>
                  <p className="text-slate-600">
                    Enter new password for <br />
                    <span className="text-slate-700 font-medium">
                      {otpEmail}
                    </span>
                  </p>
                </div>

                <div className="space-y-6">
                  {/* NEW PASSWORD */}
                  <div>
                    <label className="text-slate-700 mb-2 block text-sm font-medium">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="border-slate-200 w-full rounded-2xl border-2 bg-white/60 px-4 py-4 outline-none focus:border-blue-400 focus:bg-white focus:shadow-lg"
                      placeholder="Enter new password"
                    />
                  </div>

                  {/* CONFIRM PASSWORD */}
                  <div>
                    <label className="text-slate-700 mb-2 block text-sm font-medium">
                      Confirm Password
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="border-slate-200 w-full rounded-2xl border-2 bg-white/60 px-4 py-4 outline-none focus:border-blue-400 focus:bg-white focus:shadow-lg"
                      placeholder="Confirm password"
                    />
                  </div>

                  {/* RESET BUTTON */}
                  <motion.button
                    type="button"
                    onClick={resetPassword}
                    disabled={loading}
                    className="w-full rounded-full bg-gradient-to-r from-blue-500 via-purple-500 to-teal-500 py-4 font-semibold text-white shadow-lg"
                    whileTap={{ scale: 0.98 }}
                  >
                    {loading ? "Resetting..." : "Reset Password"}
                  </motion.button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

export default SignIn;
