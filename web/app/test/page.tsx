"use client";

import React, { useRef, useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";
const VideoColorExtractor = () => {
  const videoRef = useRef(null);
  const [color, setColor] = useState("null");

  useEffect(() => {
    const video = videoRef.current;

    const getDominantColor = async () => {
      if (!video) return;
      if (!video.paused && !video.ended) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        const fac = new FastAverageColor();

        const avg = await fac.getColorAsync(video, {
          ignoredColor: [255, 255, 255, 255], // white
        });
        setColor(avg.hex);
        console.log(avg.hex);
        
        requestAnimationFrame(getDominantColor);
      }
    };

    if (video) {
      video.addEventListener("play", getDominantColor);
    }

    return () => {
      if (video) {
        video.removeEventListener("play", getDominantColor);
      }
    };
  }, []);

  useEffect(() => {
    const getStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error("Error accessing screen capture:", error);
      }
    };

    getStream();

    // Clean up
    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return (
    <div className="h-screen w-screen" style={{ background: color }}>
      <video ref={videoRef} controls autoPlay>
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

export default VideoColorExtractor;
