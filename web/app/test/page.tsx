"use client";

import React, { useRef, useEffect, useState } from "react";
import { FastAverageColor } from "fast-average-color";
import { Button } from "@/components/ui/button";
import useWebSocket from "react-use-websocket";
const VideoColorExtractor = () => {
  const videoRef = useRef<null | HTMLVideoElement>(null);
//   const { sendMessage, lastMessage, readyState } = useWebSocket(
//     "ws://localhost:5005/ws?id=68d560c40a24&type=remote"
//   );
  const [color, setColor] = useState("null");

  useEffect(() => {
    const video = videoRef.current;

    const getDominantColor = async () => {
      if (!video) return;
      if (!video.paused && !video.ended) {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        if (!ctx) return;

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

  return (
    <div className="h-screen w-screen" style={{ background: color }}>
      <video ref={videoRef} controls autoPlay>
        Your browser does not support the video tag.
      </video>
      <Button onClick={() => getStream()}>Get Video</Button>
    </div>
  );
};

export default VideoColorExtractor;
