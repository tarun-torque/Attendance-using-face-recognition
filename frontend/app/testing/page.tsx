"use client";
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import Image from "next/image";
import { Button } from "@/components/ui/button";

const FaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceImages, setFaceImages] = useState<string[]>([]);
  const [isVideoRunning, setIsVideoRunning] = useState(false);
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);
  const MAX_IMAGES = 20; // Maximum number of images to capture

  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = "/models";
        await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      } catch (error) {
        console.error("Error loading models:", error);
      }
    };

    loadModels();
  }, []);

  const startVideo = () => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((stream) => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.addEventListener("loadedmetadata", () => {
            const { videoWidth, videoHeight } = videoRef.current!;
            videoRef.current!.width = videoWidth;
            videoRef.current!.height = videoHeight;

            if (canvasRef.current) {
              canvasRef.current.width = videoWidth;
              canvasRef.current.height = videoHeight;
            }
          });
        }
      })
      .catch((err) => console.error("Error accessing webcam:", err));
  };

  const stopVideo = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }
    setIsVideoRunning(false);
    if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  const handleStart = () => {
    setFaceImages([]);
    setIsVideoRunning(true);
    startVideo();
  };

  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;

      faceapi.matchDimensions(canvas, {
        width: videoRef.current.width,
        height: videoRef.current.height,
      });

      const id = setInterval(async () => {
        if (!isVideoRunning || faceImages.length >= MAX_IMAGES) {
          clearInterval(id);
          stopVideo();
          return;
        }

        const detections = await faceapi
          .detectAllFaces(
            videoRef.current!,
            new faceapi.TinyFaceDetectorOptions()
          )
          .withFaceLandmarks()
          .withFaceExpressions()
          .withAgeAndGender();

        const resizedDetections = faceapi.resizeResults(detections, {
          width: videoRef.current!.width,
          height: videoRef.current!.height,
        });

        const ctx = canvas.getContext("2d");
        ctx?.clearRect(0, 0, canvas.width, canvas.height);

        faceapi.draw.drawDetections(canvas, resizedDetections);
        faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        faceapi.draw.drawFaceExpressions(canvas, resizedDetections);

        if (resizedDetections.length > 0) {
          const face = resizedDetections[0].detection.box;

          const faceCanvas = document.createElement("canvas");
          const faceCtx = faceCanvas.getContext("2d");
          faceCanvas.width = face.width;
          faceCanvas.height = face.height;
          faceCtx?.drawImage(
            videoRef.current!,
            face.x,
            face.y,
            face.width,
            face.height,
            0,
            0,
            face.width,
            face.height
          );

          const imageUrl = faceCanvas.toDataURL();
          setFaceImages((prevImages) => {
            if (prevImages.length < MAX_IMAGES) {
              return [...prevImages, imageUrl];
            } else {
              return prevImages;
            }
          });
        }
      }, 100);
      setIntervalId(id);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {faceImages.length > 0 ? (
        <p>Total Images: {faceImages.length}</p>
      ) : (
        <Button onClick={handleStart} disabled={isVideoRunning}>
          Start Video
        </Button>
      )}

      <div style={{ position: "relative", width: "30%", height: "auto" }}>
        <video
          ref={videoRef}
          autoPlay
          muted
          onPlay={handleVideoPlay}
          style={{ width: "100%", height: "auto" }}
        />
        <canvas
          ref={canvasRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "auto",
          }}
        />
      </div>

      {faceImages.length === 0 && isVideoRunning && (
        <p>Please wait a few seconds...</p>
      )}

      <div className="mt-4 grid grid-cols-3 gap-4">
        {faceImages.length > 0 ? (
          faceImages.map((img, index) => (
            <Image
              key={index}
              src={img}
              height={100}
              width={100}
              alt={`Face ${index + 1}`}
            />
          ))
        ) : ""}
      </div>
    </div>
  );
};

export default FaceDetection;
