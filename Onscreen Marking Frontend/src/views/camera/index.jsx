import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import axios from "axios";

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const dragRef = useRef(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (webcamRef.current) {
        window.webcamRef = webcamRef;
        console.log("✅ WebcamRef Ready");
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, []);

  const [position, setPosition] = useState({
    x: window.innerWidth - 220,
    y: window.innerHeight - 180,
  });

  const [dragging, setDragging] = useState(false);
  const offset = useRef({ x: 0, y: 0 });

  // 📸 Capture function
  const captureImage = async () => {
    try {
      if (!webcamRef.current) return;
      if (document.visibilityState !== "visible") return;

      const imageSrc = webcamRef.current.getScreenshot();
      if (!imageSrc) return;

      await axios.post(
        `${process.env.REACT_APP_API_URL}/api/auth/camera/upload`,
        {
          image: imageSrc,
          userId: localStorage.getItem("userId"),
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );

      console.log("📸 Image sent");
    } catch (err) {
      console.error("Upload failed", err);
    }
  };

  // 🔁 Continuous capture
  useEffect(() => {
    const interval = setInterval(captureImage, 150000);
    return () => clearInterval(interval);
  }, []);

  // 🟢 Mouse Events
  const onMouseDown = (e) => {
    setDragging(true);
    offset.current = {
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    };
  };

  const onMouseMove = (e) => {
    if (!dragging) return;

    setPosition({
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    });
  };

  const onMouseUp = () => {
    setDragging(false);
  };

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    };
  });

  return (
    <div
      ref={dragRef}
      onMouseDown={onMouseDown}
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        width: "180px",
        height: "130px",
        zIndex: 9999,
        borderRadius: "10px",
        overflow: "hidden",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
        border: "2px solid #4f46e5",
        background: "#000",
        cursor: "move",
      }}
    >
      <Webcam
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        videoConstraints={{ facingMode: "user" }}
        style={{
          width: "100%",
          height: "100%",
          objectFit: "cover",
        }}
      />

      {/* 🔴 LIVE indicator */}
      <div
        style={{
          position: "absolute",
          top: "5px",
          left: "5px",
          background: "red",
          color: "white",
          fontSize: "10px",
          padding: "2px 6px",
          borderRadius: "4px",
        }}
      >
        LIVE
      </div>
    </div>
  );
};

export default WebcamCapture;
