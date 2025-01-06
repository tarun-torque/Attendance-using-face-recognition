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
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

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
        console.log("getting error on loading model", error);
      }
    };

    loadModels();
  }, []);

  useEffect(() => {
    console.log("timer", timer);
  });

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
    if (timer) {
      clearTimeout(timer);
      setTimer(null);
    }
  };

  const handleStart = () => {
    setFaceImages([]);
    setIsVideoRunning(true);
    startVideo();
    const newTimer = setTimeout(() => {
      stopVideo();
    }, 30000);
    setTimer(newTimer);
  };

  const handleVideoPlay = async () => {
    if (videoRef.current && canvasRef.current) {
      const canvas = canvasRef.current;

      faceapi.matchDimensions(canvas, {
        width: videoRef.current.width,
        height: videoRef.current.height,
      });

      const interval = setInterval(async () => {
        if (!isVideoRunning) {
          clearInterval(interval);
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
          setFaceImages((prevImages) => [...prevImages, imageUrl]);
        }
      }, 100);
    }
  };

  return (
    <div className="flex flex-col items-center">
      {faceImages.length > 0 ? (
        <p>Total Images {faceImages.length}</p>
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


      {
        faceImages.length == 0 && isVideoRunning == true ? <p>Please wait few seconds</p> :""
      }

      {/* button clicked and image zero */}

      <div className="mt-4 grid grid-cols-3 gap-4">
        {faceImages.length > 0 ? faceImages.map((img, index) => (
          <Image
            key={index}
            src={img}
            height={100}
            width={100}
            alt={`Face ${index + 1}`}
          />
        )) : <p>no images</p>   }
      </div>

      


      
      
      
    </div>
  );
};

export default FaceDetection;
