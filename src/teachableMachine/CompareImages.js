import styles from "./TrainMachine.module.css";
import clos from "../Assets/close.png";
import { useEffect, useRef, useState } from "react";
import { useIndexedDB } from "react-indexed-db";

import * as tf from "@tensorflow/tfjs";

let mobilenet = undefined;
let send = false;
let predict = false;
let CLASS_NAMES = [];
let classColor = [];
let trainingDataInputs = [];
let trainingDataOutputs = [];
let model;

function CompareImages({
  isShow,
  handleDialogModalClose = () => {},
  advanceSetting,
}) {
  const [isPlay, setPlay] = useState(false);
  const [stateload, setStateload] = useState(false);
  const [dataLoaded, setDataLoaded] = useState(false);

  const [detected, setDetected] = useState({
    name: "",
    parent: "",
  });

  const [dbImageDetails, setDbImageDetails] = useState("");
  const [videoLoaded, setvideoLoaded] = useState(false);
  const [tensors, setTensors] = useState(false);
  const [prediction, setPrediction] = useState([]);
  const [isShowProcess, setIsShowProcess] = useState(false);
  const { getAll } = useIndexedDB("SavedFaces");

  //   const history = useHistory();
  const MOBILE_NET_INPUT_WIDTH = 224;
  const MOBILE_NET_INPUT_HEIGHT = 224;
  const videoRef = useRef();
  const interval = useRef();

  const [isFaceDetected, setIsFaceDetected] = useState(false);

  const loadmodels = async () => {
    try {
      const URL =
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
      mobilenet = await tf
        .loadGraphModel(URL, { fromTFHub: true })
        .then(setStateload(true));
    } catch (e) {
      console.error(e);
    }
  };
  useEffect(() => {
    loadmodels();
  }, []);

  useEffect(() => {
    if (stateload && dataLoaded && videoLoaded) {
      interval.current = window.setInterval(() => {
        predictLoop();
      }, 1000);
    }
  }, [stateload, videoLoaded, dataLoaded]);

  useEffect(() => {
    if (isPlay === true) {
      getAll().then((result) => {
        setDbImageDetails(result);
        setDataLoaded(true);
      });
    }
  }, [isPlay]);

  let face = false;
  useEffect(() => {
    if (dataLoaded === true) {
      CLASS_NAMES = [];
      trainingDataInputs = [];
      trainingDataOutputs = [];
      let count = 0;

      setIsShowProcess(true);
      setIsFaceDetected(true);
      face = true;
      dbImageDetails.map((image) => {
        CLASS_NAMES.push(image.id);
        classColor.push(
          "#" + Math.floor(Math.random() * 16777215).toString(16)
        );
        let tensors = JSON.parse(image.imagetensors);
        tensors.map((tensor) => {
          trainingDataInputs.push(tf.tensor(tensor));
          trainingDataOutputs.push(count);
        });
        count += 1;
        console.log(CLASS_NAMES, trainingDataInputs, trainingDataOutputs);
      });

      if (!face) {
        return;
      }
      if (CLASS_NAMES.length === 1) {
        CLASS_NAMES.push("UnKnown");
        classColor.push(
          "#" + Math.floor(Math.random() * 16777215).toString(16)
        );
        setTensors(true);
      } else {
        setTensors(true);
      }
      model = tf.sequential();
      model.add(
        tf.layers.dense({
          inputShape: [1024],
          units: 128,
          activation: "relu",
        })
      );
      model.add(
        tf.layers.dense({
          units: CLASS_NAMES.length,
          activation: "softmax",
        })
      );

      model.summary();

      // Compile the model with the defined optimizer and specify a loss function to use.
      model.compile({
        // Adam changes the learning rate over time which is useful.
        optimizer: "adam",
        // Use the correct loss function. If 2 classes of data, must use binaryCrossentropy.
        // Else categoricalCrossentropy is used if more than 2 classes.
        loss:
          CLASS_NAMES.length === CLASS_NAMES.length
            ? "binaryCrossentropy"
            : "categoricalCrossentropy",
        // As this is a classification problem you can record accuracy in the logs too!
        metrics: ["accuracy"],
      });
    }
  }, [dataLoaded]);

  useEffect(() => {
    if (!isFaceDetected) {
      return;
    }
    if (videoLoaded === true && dataLoaded === true) {
      setTimeout(() => {
        trainAndPredict(trainingDataInputs, trainingDataOutputs);
      }, 2500);
    }
  }, [videoLoaded, dataLoaded, isFaceDetected]);

  //   useEffect(() => {
  //     if (interimTranscript !== "") {
  //       setResults(interimTranscript);
  //       let isSpeechDetectionFlag = false;
  //       let i = null;
  //       Object.entries(allDetails).map((ele) => {
  //         if (ele[1].speechText !== null && ele[1].speechText !== "") {
  //           if (
  //             ele[1].speechText.toLowerCase() ===
  //             interimTranscript.trim().toLowerCase()
  //           ) {
  //             isSpeechDetectionFlag = true;
  //             i = ele;
  //           }
  //         }

  //         return null;
  //       });

  //       if (isSpeechDetectionFlag && i) {
  //         if (allDetails[i[1].id].displayText !== null) {
  //           setText(allDetails[i[1].id].displayText);
  //         }
  //         if (allDetails[i[1].id].image !== null) {
  //           getByID(allDetails[i[1].id].id).then((event) => {
  //             console.log('event.imageURL',event.imageURL)
  //             // setImage(event.imageURL);
  //           });
  //         }
  //         // if (
  //         //   enable.s1.pc === true &&
  //         //   allDetails[i[1].id].sliderOption === "TX1"
  //         // ) {
  //         //   props.worker.postMessage({
  //         //     type: "writeArray",
  //         //     value: [85, 83, Number(allDetails[i[1].id].sliderValue)],
  //         //   });
  //         //   send = true;
  //         // }
  //         setSize(allDetails[i[1].id].selectedSize);
  //       } else if (!isSpeechDetectionFlag) {
  //         setText("value");

  //         setImage(null);

  //         // if (enable.s1.pc === true) {
  //         //   props.worker.postMessage({
  //         //     type: "writeArray",
  //         //     value: [85, 83, 0],
  //         //   });
  //         // }
  //       }
  //     }
  //   }, [interimTranscript]);

  const calculateFeaturesOnCurrentFrame = () => {
    return tf.tidy(function () {
      let videoFrameAsTensor = tf.browser.fromPixels(videoRef.current);

      // Resize video frame tensor to be 224 x 224 pixels which is needed by MobileNet for input.
      let resizedTensorFrame = tf.image.resizeBilinear(
        videoFrameAsTensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );

      let normalizedTensorFrame = resizedTensorFrame.div(255);
      if (mobilenet == undefined) return;
      return mobilenet.predict(normalizedTensorFrame.expandDims()).squeeze();
    });
  };

  const trainAndPredict = async (trainingDataInputs, outputs) => {
    // const advanceSetting = props.appModeStorage.trainMachine.advanceSetting;
    console.log(CLASS_NAMES.length, trainingDataInputs, trainingDataOutputs);
    tf.util.shuffleCombo(trainingDataInputs, outputs);

    let outputsAsTensor = tf.tensor1d(outputs, "int32");
    let oneHotOutputs = tf.oneHot(outputsAsTensor, CLASS_NAMES.length);
    let inputsAsTensor = tf.stack(trainingDataInputs);

    await model.fit(inputsAsTensor, oneHotOutputs, {
      shuffle: true,
      batchSize: advanceSetting.batchSize,
      epochs: advanceSetting.epochs,
      callbacks: { onEpochEnd: logProgress },
    });

    outputsAsTensor.dispose();
    oneHotOutputs.dispose();
    inputsAsTensor.dispose();
    predict = true;
    setIsShowProcess(false);
    predictLoop();
  };

  const logProgress = (epoch, logs) => {
    console.log("Data for epoch " + epoch, logs);
  };

  const predictLoop = () => {
    if (predict && videoRef.current !== null) {
      tf.tidy(function () {
        let imageFeatures = calculateFeaturesOnCurrentFrame();
        if (imageFeatures == undefined) return;
        let prediction = model.predict(imageFeatures.expandDims()).squeeze();
        let highestIndex = prediction.argMax().arraySync();
        let predictionArray = prediction.arraySync();
        setPrediction(predictionArray);
        console.log(
          "Prediction: " +
            CLASS_NAMES[highestIndex] +
            " with " +
            Math.floor(predictionArray[highestIndex] * 100) +
            "% confidence"
        );
        if (Math.floor(predictionArray[highestIndex] * 100) >= 95) {
          if (CLASS_NAMES[highestIndex] !== "Unknown") {
            // setDetected(CLASS_NAMES[highestIndex] + " is detected");
            setDetected({
              name: CLASS_NAMES[highestIndex],
              parent: Math.floor(predictionArray[highestIndex] * 100),
            });
          }
        } else {
          if (CLASS_NAMES[highestIndex] !== "Unknown") {
            setDetected({
              name: CLASS_NAMES[highestIndex],
              parent: Math.floor(predictionArray[highestIndex] * 100),
            });
          }
        }
      });
    }
  };

  const reset = () => {
    predict = false;
    for (let i = 0; i < trainingDataInputs.length; i++) {
      trainingDataInputs[i].dispose();
    }
    trainingDataInputs.splice(0);
    trainingDataOutputs.splice(0);
    console.log("Tensors in memory: " + tf.memory().numTensors);
  };

  const enableCam = () => {
    navigator.mediaDevices
      .getUserMedia({ audio: false, video: { width: 300 } })
      .then((stream) => {
        let video = videoRef.current;
        video.srcObject = stream;
        setvideoLoaded(true);
        video.play();
      })
      .catch((err) => {
        console.error("error:", err);
      });
  };

  const disableCam = () => {
    setvideoLoaded(false);
    videoRef.current.pause();
    videoRef.current.srcObject.getTracks()[0].stop();
  };

  const onStart = () => {
    if (isPlay) {
      setPlay(false);
      setStateload(false);
      reset();
      disableCam();
      setDataLoaded(false);
      clearInterval(interval.current);
      setDetected({
        name: "",
        parent: "",
      });
    } else {
      setPlay(true);
      enableCam();
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
                // stopWebcam();
                // setStartCam(false);

                handleDialogModalClose();
              }}
              alt="Close"
            />
            <div style={{}}>
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

              <div>
                Prediction: {detected.name} with {detected.parent} "% confidence
              </div>

              <div>
                <button onClick={onStart}>play/pause</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default CompareImages;
