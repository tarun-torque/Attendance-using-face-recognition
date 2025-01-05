"use client";
import React, { useRef, useState, useEffect } from "react";
import Webcam from "react-webcam";
import axios from "axios";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const WebcamCapture = () => {
  const webcamRef = useRef(null);
  const [images, setImages] = useState([]);

  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Capture image from webcam
  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImages((prevImages) => [...prevImages, imageSrc]);
  }, [webcamRef]);

  // Send captured image to backend for face recognition
  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append("image", imageSrc);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/upload-image",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        }
      );
      console.log(response.data);
    } catch (error) {
      console.error("Error uploading image:", error);
    }
  };

  return (
    <div>
      <h1>{isClient ? "This is never prerendered" : "Prerendered"}</h1>

      {/* <div>
        <Image
          src="/assets/noPic.png"
          height={500}
          width={500}
          alt="Captured"
        />
      </div> */}

      <div className="flex flex-row flex-wrap">
        {images.map((img, index) => (
          <Image
            key={index}
            src={img}
            width={100}
            height={100}
            alt={`Captured ${index}`}
            style={{ width: "100px", margin: "5px" }}
            className="rounded"
          />
        ))}
      </div>

      <p>the number of images are {images.length}</p>

      <Dialog>
        <DialogTrigger>
          <Button>Take Photo</Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </DialogHeader>

          <DialogDescription>
            <Webcam
              audio={false}
              ref={webcamRef}
              screenshotFormat="image/jpeg"
              width="100%"
              videoConstraints={{ facingMode: "user" }}
            />

            <Button onClick={capture}>Capture</Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default WebcamCapture;
