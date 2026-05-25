import React, { useEffect, useState } from "react";
import {
  Routes,
  Route,
  Navigate,
  useLocation,
  useNavigate,
} from "react-router-dom";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";
import { toast } from "react-toastify";

import AdminLayout from "layouts/admin";
import EvaluatorLayout from "layouts/evaluator/index.jsx";
import ReviewerLayout from "layouts/reviewer/index.jsx";
import HeadLayout from "layouts/head/index.jsx";
import QALayout from "layouts/qualitycheck/index.jsx";
import Scanner from "layouts/scanner/Index";
import AuthLayout from "layouts/auth/index.jsx";
import CheckModule from "views/evaluator/CheckModule/CheckModule";
import WebcamCapture from "./views/camera/index";
import CheckModuler from "views/reviewer/CheckModule/CheckModule";
import CheckModulers from "views/head/CheckModule/CheckModule";
import QAModulers from "views/qualitycheck/CheckModule/CheckModule";
import Principal from "layouts/final_authority/Index";
// import Head from "layouts/head/index";

import { rehydrateToken } from "./store/authSlice";
import { getUserDetails } from "services/common";
import "./App.css";
import QualityControl from "layouts/qualitycontrol/Index";

const App = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const token = localStorage.getItem("token");
  const [user, setUser] = useState(token);

  const getRoleFromToken = () => {
    if (!token) return null;
    try {
      const decodedToken = jwtDecode(token);
      return decodedToken.role;
    } catch (error) {
      console.error("Invalid token:", error);
      return null;
    }
  };

  const role = getRoleFromToken();

  /**
   * Fetch logged-in user details
   */
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserDetails(token);
        setUser(response?.data);
      } catch (error) {
        console.log(error);
        toast.error(error?.response?.data?.message);
      }
    };

    if (token) {
      fetchUser();
    }
  }, [token]);

  /**
   * Role-based redirection & auth guard
   */
  useEffect(() => {
    if (
      !token ||
      user?.message === "Unauthorized" ||
      user?.message === "User not found"
    ) {
      if (!location.pathname.startsWith("/auth")) {
        navigate("/auth/sign-in");
      }
    } else {
      if (role === "admin" && !location.pathname.startsWith("/admin")) {
        navigate("/admin/default");
      } else if (
        ["evaluator", "moderator"].includes(role) &&
        !location.pathname.startsWith("/evaluator")
      ) {
        navigate("/evaluator/default");
      } else if (
        ["reviewer"].includes(role) &&
        !location.pathname.startsWith("/reviewer")
      ) {
        navigate("/reviewer/default");
      } else if (
        ["headevaluator"].includes(role) &&
        !location.pathname.startsWith("/headevaluator")
      ) {
        navigate("/headevaluator/default");
      } else if (
        ["qualitycheck"].includes(role) &&
        !location.pathname.startsWith("/qualitycheck")
      ) {
        navigate("/qualitycheck/default");
      } else if (
        ["modulater"].includes(role) &&
        !location.pathname.startsWith("/modulater")
      ) {
        navigate("/modulater/default");
      } else if (
        ["qualitycontrol"].includes(role) &&
        !location.pathname.startsWith("/qualitycontrol")
      ) {
        navigate("/qualitycontrol/default");
      } else if (
        role === "principal" &&
        !location.pathname.startsWith("/principal")
      ) {
        navigate("/principal/default");
      }
    }
  }, [token, role, location.pathname, navigate, user]);

  /**
   * Redux token rehydration
   */
  useEffect(() => {
    dispatch(rehydrateToken());
  }, [dispatch]);

  /**
   * 🔴 Auto logout on browser/tab close
   */
  // useEffect(() => {
  //   const handleUnload = () => {
  //     const token = localStorage.getItem("token");
  //     if (!token) return;

  //     const blob = new Blob([JSON.stringify({ token })], {
  //       type: "text/plane",
  //     });

  //     navigator.sendBeacon(
  //       `${process.env.REACT_APP_API_URL}/api/auth/auto-logout`,
  //       blob
  //     );
  //   };

  //   window.addEventListener("beforeunload", handleUnload);

  //   document.addEventListener("visibilitychange", () => {
  //     if (document.visibilityState === "hidden") {
  //       handleUnload();
  //     }
  //   });

  //   return () => {
  //     window.removeEventListener("beforeunload", handleUnload);
  //   };
  // }, []);

  useEffect(() => {
    const handleUnload = async () => {
      const token = localStorage.getItem("token");
      if (!token) return;

      try {
        const res = await fetch(
          `${process.env.REACT_APP_API_URL}/api/auth/auto-logout/abhi`,
          {
            method: "POST",
            headers: {
              "Content-Type": "text/plain",
            },
            body: JSON.stringify({ token }),
            keepalive: true, // IMPORTANT
          }
        );

        const data = await res.json();

        if (data?.autoLogout) {
          localStorage.removeItem("token");
          localStorage.removeItem("userId");
          window.location.href = "/auth/sign-in";
        }
      } catch (error) {
        console.log("Auto logout failed");
      }
    };

    window.addEventListener("beforeunload", handleUnload);

    return () => {
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, []);

  return (
    <>
      {token && !location.pathname.startsWith("/auth") && <WebcamCapture />}

      <Routes>
        <Route path="auth/*" element={<AuthLayout />} />
        <Route path="admin/*" element={<AdminLayout />} />
        <Route path="evaluator/task/:id" element={<CheckModule />} />
        <Route path="evaluator/*" element={<EvaluatorLayout />} />
        <Route path="reviewer/task/:id" element={<CheckModuler />} />
        <Route path="reviewer/*" element={<ReviewerLayout />} />
        <Route path="headevaluator/task/:id" element={<CheckModulers />} />
        <Route path="headevaluator/*" element={<HeadLayout />} />
        <Route path="qualitycheck/task/:id" element={<QAModulers />} />
        <Route path="qualitycheck/*" element={<QALayout />} />
        <Route path="head/*" element={<HeadLayout />} />
        <Route path="qualitycheck/*" element={<QALayout />} />
        <Route path="principal/*" element={<Principal />} />
        <Route path="modulater/*" element={<Scanner />} />
        <Route path="qualitycontrol/*" element={<QualityControl />} />
        <Route path="/" element={<Navigate to="/admin/default" replace />} />
      </Routes>
    </>
  );
};

export default App;
