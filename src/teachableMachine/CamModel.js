import eachImgCross from "../Assets/eachImgCross.svg";
import clos from "../Assets/close.png";

import { useState, useRef, useEffect } from "react";
import styles from "./TrainMachine.module.css";

function CamModule(props) {
  const {
    selectedClass = "",
    isShow = false,
    imageUpload = false,
    handleDialogModalClose = () => {},
    ImageClasses,
  } = props;
  const [startCam, setStartCam] = useState(false);
  const [stream, setStream] = useState(false);
  const [captureInterval, setCaptureInterval] = useState(null);
  const [imageTypeError, setImageTypeError] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const videoRef = useRef();
  const imagesEndRef = useRef();
  const imageInputRef = useRef(null);
  const errorTimeOutRef = useRef(null);

  useEffect(() => {
    imagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [ImageClasses[selectedClass]?.capturedImages]);

  //start the web cam
  const startWebcam = () => {
    try {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: false })
        .then((stream) => {
          setStream(true);
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          setStartCam(true);
        })
        .catch((err) => {
          alert("Please connect your the camera.");
          console.error("Webcam error:", err);
        });
    } catch (e) {
      console.error("ERROR", e);
      alert("Please connect your the camera.");
    }
  };

  //stop the web cam
  const stopWebcam = () => {
    try {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      }
      setStream(false);
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  const webcamHandelClick = () => {
    if (startCam) {
      stopWebcam();
      setStartCam(false);
    } else {
      startWebcam();
    }
  };

  const captureImageFromVideo = () => {
    const canvas = document.getElementById("canvas");
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    return canvas;
  };

  const handleCaptureFromVideo = async () => {
    const canvas = captureImageFromVideo();
    saveCapturedImage(canvas.toDataURL("image/jpeg"));
  };

  //check it is a image file or not
  const isImageFile = (file) => {
    return (
      file &&
      (file.type.startsWith("image/") ||
        [".jpg", ".jpeg", ".png", ".webp"].some((ext) =>
          file.name.toLowerCase().endsWith(ext)
        ))
    );
  };

  const processUploadImage = (file) => {
    if (file) {
      if (errorTimeOutRef.current) {
        clearTimeout(errorTimeOutRef.current);
        errorTimeOutRef.current = null;
        setImageTypeError(false);
      }
      // const img = new Image()
      // img.src = URL.createObjectURL(file)
      // img.onload = async () => {
      //     saveCapturedImage(img.src)
      // }
      const reader = new FileReader();
      reader.onloadend = () => {
        saveCapturedImage(reader.result);
      };

      reader.readAsDataURL(file); // Convert the file to base64
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (isImageFile(file)) {
      processUploadImage(file);
    } else {
      setImageTypeError(true);
      if (errorTimeOutRef.current) {
        clearTimeout(errorTimeOutRef.current);
        errorTimeOutRef.current = null;
      }
      errorTimeOutRef.current = setTimeout(() => {
        setImageTypeError(false);
        errorTimeOutRef.current = null;
      }, 3000);
    }
  };

  // Start continuous capture
  const startContinuousCapture = () => {
    if (!captureInterval) {
      handleCaptureFromVideo();
      const interval = setInterval(() => {
        handleCaptureFromVideo();
      }, 200); // Capture every 500ms
      setCaptureInterval(interval);
    }
  };

  // Stop continuous capture
  const stopContinuousCapture = () => {
    if (captureInterval) {
      clearInterval(captureInterval);
      setCaptureInterval(null);
    }
  };

  //image save to redux
  const saveCapturedImage = (imageSrc) => {
    let selectedClassDetails = ImageClasses[selectedClass];
    const updatedImages = [...selectedClassDetails.capturedImages, imageSrc];
    selectedClassDetails.capturedImages = updatedImages;

    let newImageClasses = { ...props.ImageClasses };
    newImageClasses[selectedClass] = selectedClassDetails;
    props.setImageClasses(newImageClasses);
  };

  const handleDrop = (event) => {
    event.preventDefault();

    const droppedFile = event.dataTransfer.files[0];
    if (isImageFile(droppedFile)) {
      processUploadImage(droppedFile);
    } else {
      setImageTypeError(true);
      if (errorTimeOutRef.current) {
        clearTimeout(errorTimeOutRef.current);
        errorTimeOutRef.current = null;
      }
      errorTimeOutRef.current = setTimeout(() => {
        setImageTypeError(false);
      }, 3000);
    }
  };
  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  //remove only single image
  const removeSingleSample = (index) => {
    try {
      let selectedClassDetails = ImageClasses[selectedClass];
      let imgArr = [...selectedClassDetails.capturedImages];
      imgArr.splice(index, 1);
      selectedClassDetails.capturedImages = imgArr;

      let newImageClasses = { ...props.ImageClasses };
      newImageClasses[selectedClass] = selectedClassDetails;
      props.setImageClasses(newImageClasses);
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  return (
    <>
      {isShow && (
        <div className={styles.webCamModel}>
          <div className={styles.webCamModelInner}>
            {/* --------- close button --------------- */}
            <img
              className={styles.WebCamModelCloseBtn}
              src={clos}
              onClick={() => {
                stopWebcam();
                setStartCam(false);
                // clsoeSave()
                handleDialogModalClose();
              }}
              alt="Close"
            />

            {imageUpload ? (
              <div
                className={styles.webCamModelUploadDiv}
                onClick={() =>
                  imageInputRef?.current && imageInputRef?.current?.click()
                }
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
              >
                <input
                  ref={imageInputRef}
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={handleImageUpload}
                />
                <p className={styles.webCamModelUploadText}>
                  Choose images from your files, or drag & drop here
                </p>

                {imageTypeError && (
                  <p
                    className={`${styles.webCamModelUploadText} ${styles.webCamModelUploadTextError}`}
                  >
                    Only image files are allowed. Supported formats: .jpg,
                    .jpeg, .png, .webp
                  </p>
                )}
                <canvas
                  id="canvas"
                  width="224"
                  height="224"
                  style={{ display: "none" }}
                ></canvas>
              </div>
            ) : (
              <div>
                <div className={styles.webCamModelCameraDiv}>
                  <video
                    ref={videoRef}
                    height={300}
                    width={300}
                    style={{ borderRadius: "10px" }}
                  />

                  <canvas
                    id="canvas"
                    width="224"
                    height="224"
                    style={{ display: "none" }}
                  ></canvas>
                </div>
                <div className={styles.webCamModelBtnDiv}>
                  <button
                    disabled={!startCam}
                    // onClick={handleCaptureFromVideo}
                    onMouseDown={startContinuousCapture}
                    onMouseUp={stopContinuousCapture}
                    onMouseLeave={stopContinuousCapture}
                    className={styles.capturePhotoBtn}
                    style={!startCam ? { opacity: "0.5" } : {}}
                  >
                    Capture Photo
                  </button>
                  <button
                    onClick={webcamHandelClick}
                    className={styles.capturePhotoBtn}
                  >
                    {startCam ? "Close Webcam" : "Start Webcam"}
                  </button>
                </div>
              </div>
            )}

            {/* --------- images ----------------------------- */}
            <div className={styles.captureImagesDiv}>
              {ImageClasses[selectedClass].capturedImages.map((img, index) => (
                <div key={index} className={styles.sampleImgDiv}>
                  <img width="70px" src={img} alt={`Captured ${index}`} />
                  <img
                    src={eachImgCross}
                    className={styles.imgDelete}
                    id={styles.imgDelete}
                    alt="delete each image"
                    onClick={() => removeSingleSample(index)}
                  />
                  <div
                    className={`${styles.tooltipDiv} ${styles.imgDeleteToolTip}`}
                  >
                    Delete image
                  </div>
                </div>
              ))}
              <div ref={imagesEndRef}></div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CamModule;
