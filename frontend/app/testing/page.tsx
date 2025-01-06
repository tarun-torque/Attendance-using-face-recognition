"use client";
import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import Image from "next/image";

const FaceDetection = () => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null); // Store captured face image

  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = "/models";
      await faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.faceExpressionNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ageGenderNet.loadFromUri(MODEL_URL);
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);

      startVideo();
    };

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

    loadModels();
  }, []);

  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;

      // Match the size of the canvas to the video dimensions
      faceapi.matchDimensions(canvas, {
        width: videoRef.current.width,
        height: videoRef.current.height,
      });

      setInterval(async () => {
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

        // Capture the first face detection (if available)
        if (resizedDetections.length > 0) {
          const face = resizedDetections[0].detection.box;
          console.log("Detected face box:", face);

          // Draw face region on a new canvas
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

          // Convert the canvas to an image and display it
          const imageUrl = faceCanvas.toDataURL();
          setFaceImage(imageUrl); // Set image source to the state
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-row justify-center items-center">
    <div style={{ position: "relative",height:"30%",width:"30%" }}>
      <video
        ref={videoRef}
        autoPlay
        muted
        onPlay={handleVideoPlay}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "auto" }}
      />
      <canvas
        ref={canvasRef}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "auto" }}
      />
      
    </div>

    {/* Display captured face image */}
    <div>
           {
            faceImage && <Image src={faceImage} height={100} width={100}  alt=""/>
           }
     
    </div>
  
    </div>
  );
};

export default FaceDetection;
