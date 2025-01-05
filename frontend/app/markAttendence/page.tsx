"use client";
import React, { useRef, useState } from "react";
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

import { CiCirclePlus } from "react-icons/ci";
import { CiCircleMinus } from "react-icons/ci";

const MarkAttendance = () => {
  const webcamRef = useRef(null);
  const [imageSrc, setImageSrc] = useState(null);
  const [zoom, setZoom] = useState(1);

  const capture = React.useCallback(() => {
    const imageSrc = webcamRef.current.getScreenshot();
    setImageSrc(imageSrc);
  }, [webcamRef]);

  const handleZoomIn = () => {
    setZoom((prevZoom) => Math.min(prevZoom + 0.1, 3));
  };

  const handleZoomOut = () => {
    setZoom((prevZoom) => Math.max(prevZoom - 0.1, 1));
  };

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
      {imageSrc && (
        <div>
          <Image src={imageSrc} height={100} width={100} alt="Captured" />
          <Button onClick={handleSubmit}>Mark Attendance</Button>
        </div>
      )}

      <Dialog>
        <DialogTrigger>
          <Button>Open Camera to Mark Attendance</Button>
        </DialogTrigger>

        <DialogContent className="bg-gray-800 text-white">
          <DialogHeader>
            <DialogTitle>Are you absolutely sure?</DialogTitle>
          </DialogHeader>

          <DialogDescription>
            <div className="flex items-center justify-center">
              <div className="w-40 h-40 md:w-60 md:h-60 lg:w-80 lg:h-80 overflow-hidden rounded-full">
                <Webcam
                  audio={false}
                  ref={webcamRef}
                  screenshotFormat="image/jpeg"
                  className="w-full h-full object-cover"
                  videoConstraints={{ facingMode: "user" }}
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "center",
                  }}
                />
              </div>
            </div>
            <Button onClick={handleZoomOut}><CiCircleMinus/></Button>
            <Button onClick={handleZoomIn}><CiCirclePlus/></Button>

            <Button onClick={capture}>Mark Attendance</Button>
          </DialogDescription>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarkAttendance;
