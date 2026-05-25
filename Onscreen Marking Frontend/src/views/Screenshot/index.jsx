import html2canvas from "html2canvas";
import axios from "axios";

const captureScreenAndPhoto = async (webcamRef) => {
  try {
    const token = localStorage.getItem("token");
    const userId = localStorage.getItem("userId");

    // =========================
    // ✅ 1. SCREENSHOT API CALL
    // =========================
    const canvas = await html2canvas(document.body, {
      scale: 1,
      useCORS: true,
      scrollY: -window.scrollY,
    });

    const screenImage = canvas.toDataURL("image/jpeg", 0.5);

    await axios.post(
      `${process.env.REACT_APP_API_URL}/api/auth/camera/upload`,
      {
        image: screenImage, // 👈 SAME KEY
        userId,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    console.log("📸 Screen uploaded");

    // =========================
    // ✅ 2. WEBCAM API CALL
    // =========================
    let webcamImage = null;

    if (webcamRef && webcamRef.current) {
      webcamImage = webcamRef.current.getScreenshot();
    }

    if (webcamImage) {
      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/camera/upload`,
        {
          image: webcamImage, // 👈 SAME KEY
          userId,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      console.log("📸 Webcam uploaded");
    } else {
      console.warn("⚠️ Webcam image not available");
    }
  } catch (error) {
    console.error("Capture failed", error);
  }
};

export default captureScreenAndPhoto;
