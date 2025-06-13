import questionPng from "../Assets/question.png";
import reset from "../Assets/reset.png";
import buttonPlusImg from "../Assets/add.png";

import styles from "./TrainMachine.module.css";
import { useRef, useState, useEffect } from "react";
import { jsPlumb } from "jsplumb";
import LeftTrainingClass from "./LeftTrainingClass";
import CamModule from "./CamModel";
import AudioModule from "./AudioModel";
import { useIndexedDB } from "react-indexed-db";
import * as tf from "@tensorflow/tfjs";
import DialogModal from "./DialogModal";
import CompareImages from "./CompareImages";

const MOBILE_NET_INPUT_WIDTH = 224;
const MOBILE_NET_INPUT_HEIGHT = 224;

const randomNumberGenerator = () =>
  Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;

function TrainMachine(props) {
  //   const history = useHistory();

  const leftContainerRef = useRef(null); // Reference to the left scrollable div
  const connectionContainerRef = useRef(null); // Reference to the container holding the connections
  const jsPlumbInstance = useRef(null); // Reference to jsPlumb instance
  //----------------------------------------------------------------------------------------------------
  const [showWebCamModel, setShowWebCamModel] = useState(false);
  const [showCompareModel, setShowCompareModel] = useState(false);
  // const [showAudioModel, setShowAudioModel] = useState(false)
  const [imageUpload, setImageUpload] = useState(false);

  const [selectedClass, setSelectedClass] = useState("");
  const isAudioTrain = window.location.pathname === "/AudioTrainMachine";

  const { update, getAll, clear } = useIndexedDB("SavedFaces");
  const [mobilenet, setMobilenet] = useState(null);
  const [startTraining, setStartTraining] = useState(false);
  // const [showAdvance, setShowAdvance] = useState(false)
  const [showEpochsHelp, setShowEpochsHelp] = useState(false);
  const [showBatchHelp, setShowBatchHelp] = useState(false);
  const [showModel, setShowModel] = useState({
    isShow: false,
    message: "",
    type: "",
  });

  const classes = isAudioTrain ? props.AudioClasses : props.ImageClasses;
  const isShowClassDeleteBtn = Object.keys(classes).length > 1;
  ///////////////////////////// jsPlumb connection logic start ///////////////////////////////////

  useEffect(() => {
    // Initialize jsPlumb instance
    jsPlumbInstance.current = jsPlumb.getInstance({
      PaintStyle: { stroke: "#000", strokeWidth: 2 },
      Endpoint: ["Dot", { radius: 4 }],
      Connector: ["Bezier", { curviness: 100 }],
      Container: connectionContainerRef.current, // Attach jsPlumb to the connection container
    });

    //load the mobilent model
    loadModel();
    clear();

    return () => {
      jsPlumbInstance.current?.reset();
    };
  }, []);

  useEffect(() => {
    // Connect each left-side div to the train_right div
    const rightDivId = "train_right-small-div";

    Object.keys(classes).map((ele, ind) => {
      const obj = classes?.[ele];

      const leftDivId = `train_left-div-${obj.id}`;
      const existingConnection = jsPlumbInstance.current?.getConnections({
        source: leftDivId,
        target: rightDivId,
      });

      // Avoid duplicate connections
      if (!existingConnection?.length) {
        jsPlumbInstance.current?.connect({
          source: leftDivId,
          target: rightDivId,
          anchors: ["Right", "Left"],
        });
      }
    });

    // Repaint connections to ensure proper alignment
    jsPlumbInstance.current?.repaintEverything();
  }, [classes]);

  useEffect(() => {
    // Repaint connections on scroll
    const handleScroll = () => {
      jsPlumbInstance.current?.repaintEverything();
    };

    const leftContainer = leftContainerRef.current;
    if (leftContainer) {
      leftContainer.addEventListener("scroll", handleScroll);
    }
    window.addEventListener("resize", handleScroll);

    return () => {
      if (leftContainer) {
        leftContainer.removeEventListener("scroll", handleScroll);
      }
      window.removeEventListener("resize", handleScroll);
    };
  }, []); // Attach scroll listener once on mount

  ///////////////////////////// jsPlumb connection logic end ///////////////////////////////////

  ///////////////////////////// image convert to tansor start ///////////////////////////////////
  //load the mobilent model
  const loadModel = async () => {
    try {
      const URL =
        "https://tfhub.dev/google/tfjs-model/imagenet/mobilenet_v3_small_100_224/feature_vector/5/default/1";
      const model = await tf.loadGraphModel(URL, {
        fromTFHub: true,
      });
      setMobilenet(model);
      console.log("Model loaded");
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  const processCapturedImages = async (eachClass, allTensor) => {
    const { capturedImages } = eachClass;
    try {
      for (let imageSrc of capturedImages) {
        const img = new Image();
        img.src = imageSrc;

        await new Promise((resolve) => {
          img.onload = async () => {
            const imgTensor = tf.browser.fromPixels(img);
            const features = calculateFeatures(imgTensor);
            await addFeaturesToTensor(features, allTensor);
            resolve();
          };
        });
      }
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  const calculateFeatures = (tensor) => {
    return tf.tidy(() => {
      const resizedTensor = tf.image.resizeBilinear(
        tensor,
        [MOBILE_NET_INPUT_HEIGHT, MOBILE_NET_INPUT_WIDTH],
        true
      );
      const normalizedTensor = resizedTensor.div(255);
      return mobilenet.predict(normalizedTensor.expandDims()).squeeze();
    });
  };

  const addFeaturesToTensor = async (features, allTensor) => {
    const featureArray = await features.array();
    allTensor.push(featureArray);
  };

  /////////////////////////// image convert to tansor end////////////////////////////

  /////////////////////////// svae in db tansor ////////////////////////////
  //check all classes sample are present
  const checkImagePresent = () => {
    for (const classKey in classes) {
      const capturedImages = classes?.[classKey]?.capturedImages;
      if (!capturedImages || capturedImages.length === 0) {
        return { status: true, classKey, imageNumber: 0 };
      }
      if (capturedImages.length < 10) {
        return {
          status: true,
          classKey,
          imageNumber: capturedImages.length,
        };
      }
    }
    return {
      status: false,
      classKey: "",
      imageNumber: 11,
    };
  };

  const base64toBlob = async (image) => {
    const byteCharacters = window.atob(image);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: "image/jpeg" });
    const blobUrl = URL.createObjectURL(blob);
    // return blobUrl
    sessionStorage.setItem("img", blobUrl);
  };

  const handelTrain = async () => {
    try {
      if (startTraining || Object.keys(classes).length < 2) {
        return;
      }
      if (!mobilenet) {
        // alert(
        //     "Oops! It seems there's a slow internet connection. The model is currently loading. Please wait."
        // )
        setShowModel({
          isShow: true,
          message: "Oops! The model is currently loading. Please wait.",
          type: "showMessage",
        });
        return;
      }
      let checkData = checkImagePresent();
      if (checkData.status) {
        let popupText = "";
        if (checkData.imageNumber === 0) {
          popupText = `${classes[checkData.classKey].className} has no sample.`;
        } else {
          popupText = `${
            classes[checkData.classKey].className
          } has fewer than 10 images. A minimum of 10 images is required for training.`;
        }
        setShowModel({
          isShow: true,
          message: popupText,
          type: "showMessage",
        });
        return;
      }

      setStartTraining(true);

      for (let classKey in classes) {
        let eachClass = classes[classKey];
        let allTensor = [];
        await processCapturedImages(eachClass, allTensor);

        if (eachClass.capturedImages) {
          await base64toBlob(eachClass.capturedImages[0].split(",")[1]);
          let blobdata = await fetch(sessionStorage.getItem("img")).then((r) =>
            r.blob()
          );

          let tensors = JSON.stringify(allTensor);

          var reader = new FileReader();
          reader.readAsDataURL(blobdata);
          reader.onloadend = function () {
            var base64data = reader.result;
            update({
              id: eachClass.className,
              imageUrl: base64data,
              imagetensors: tensors,
            });
          };
        }
      }

      setStartTraining(false);
      setShowModel({
        isShow: true,
        message: "Model training was successful.",
        type: "trainSuccessful",
      });
      props.setIsEnableNextBtn(true);
    } catch (e) {
      setStartTraining(false);
      setShowModel({
        isShow: true,
        message: "Model training was fail.",
        type: "showMessage",
      });
      console.error("ERROR", e);
    }
  };

  ///////////////////////////save db end //////////////////////////////
  //add new class
  const addClass = () => {
    try {
      const keys = Object.keys(classes);
      const lastKey = keys[keys.length - 1];
      let classLastNumber = parseInt(lastKey?.split("_")?.[1] || "0");
      if (classLastNumber) {
        classLastNumber = classLastNumber + 1;
      } else {
        classLastNumber = 1;
      }

      // if (isAudioTrain) {
      //     let data = {
      //         id: randomNumberGenerator(),
      //         className: 'Class' + classLastNumber,
      //         sampleType: 'Audio',
      //         indexedDbId: 'Class' + classLastNumber,
      //         capturedAudio: [],
      //     }
      //     props.setNewClasses({
      //         key: 'Class' + classLastNumber,
      //         data,
      //         classType: 'ImageClasses',
      //     })
      // } else {
      let data = {
        id: randomNumberGenerator(),
        className: "Class " + classLastNumber,
        sampleType: "Image",
        indexedDbId: "Class " + classLastNumber,
        capturedImages: [],
      };
      let newImageClasses = { ...props.ImageClasses };
      newImageClasses["Class_" + classLastNumber] = data;
      props.setImageClasses(newImageClasses);
      // }
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  const webCamModelHandel = ({ value, imageUpload, classesObjectKey }) => {
    setShowWebCamModel(value);
    setImageUpload(imageUpload);
    setSelectedClass(classesObjectKey);
  };
  // const audioModelHandel = ({ value, audioUpload, className }) => {
  //     setShowAudioModel(value)
  //     setSelectedClass(className)
  // }

  //handel change the oninput change of advance setting
  const handelAdvanceChange = (e, key) => {
    let advanceSetting = { ...props.advanceSetting };
    advanceSetting[key] = parseInt(e.target.value);

    props.setAdvanceSetting(advanceSetting);
  };

  //reset the advance setting state
  const handelReset = () => {
    props.setAdvanceSetting({ epochs: 50, batchSize: 16 });
  };

  //handel next button click
  const nextButtonHandel = () => {
    if (props.isEnableNextBtn) {
      let enable = JSON.parse(sessionStorage.getItem("enable"));
      enable = {
        ...enable,
        s2: {
          emotion: false,
          face: true,
          object: false,
        },
      };

      sessionStorage.setItem("enable", JSON.stringify(enable));
      //   history.push("/programmingPage");
    }
  };

  const handelGoNext = () => {
    setShowModel({ isShow: false, message: "", type: "" });
    nextButtonHandel();
  };

  const getModelOptions = (type) => {
    if (type === "trainSuccessful") {
      return [
        {
          text: "Next",
          do: () => handelGoNext(),
        },
      ];
    }
    return [];
  };

  return (
    <div>
      <DialogModal
        show={showModel.isShow}
        // show={true}
        text={showModel.message}
        showCloseBtn={true}
        handleDialogModalClose={() =>
          setShowModel({ isShow: false, message: "", type: "" })
        }
        optionsToSelect={getModelOptions(showModel.type)}
      />

      {/*--------------------- camera model ----------------------*/}
      <CamModule
        ImageClasses={props.ImageClasses}
        setImageClasses={props.setImageClasses}
        selectedClass={selectedClass}
        isShow={showWebCamModel}
        imageUpload={imageUpload}
        handleDialogModalClose={() =>
          webCamModelHandel({ value: false, imageUpload: false })
        }
      />

      <CompareImages
        ImageClasses={props.ImageClasses}
        setImageClasses={props.setImageClasses}
        selectedClass={selectedClass}
        isShow={showCompareModel}
        handleDialogModalClose={() => setShowCompareModel(false)}
        advanceSetting={props.advanceSetting}
      />

      {/*--------------------- Audio Model ----------------------*/}
      {/* <AudioModule
                className={selectedClass}
                isShow={showAudioModel}
                audioUpload={false}
                handleDialogModalClose={() =>
                    audioModelHandel({ value: false, audioUpload: false })
                }
            /> */}
      {/*--------------------- NavBar ----------------------*/}

      {/* -------------------- body ------------------------------ */}
      <div
        className={styles.train_parent}
        // style={{ border: '1px solid red' }}
      >
        {/* Left scrollable div */}
        <div
          // style={{ border: '1px solid green' }}
          className={styles.train_left}
          ref={leftContainerRef}
        >
          {Object.keys(classes).map((ele, ind) => {
            const obj = classes?.[ele];
            return (
              <div
                key={obj.id}
                id={`train_left-div-${obj.id}`}
                className={styles["train_left-small-div"]}
              >
                <LeftTrainingClass
                  ImageClasses={props.ImageClasses}
                  setImageClasses={props.setImageClasses}
                  jsPlumbInstance={jsPlumbInstance.current}
                  isAudioTrain={isAudioTrain}
                  obj={obj}
                  classesObjectKey={ele}
                  webCamModelOpen={webCamModelHandel}
                  classes={classes}
                  // audioModelOpen={audioModelHandel}
                  isShowClassDeleteBtn={isShowClassDeleteBtn}
                />
              </div>
            );
          })}
        </div>

        {/* Connection container */}
        <div
          className={styles["train_connection-container"]}
          ref={connectionContainerRef}
        ></div>

        {/*---------------- Right div -----------------------*/}
        <div
          // style={{ border: '1px solid green' }}
          className={styles.train_right}
        >
          <div
            className={styles["train_right-small-div"]}
            id="train_right-small-div"
          >
            <p className={styles["train_right_tranText"]}>Training</p>

            <div className={styles.advanceDiv}>
              <div className={styles.epochsDiv}>
                <div className={styles.epochsDivInr}>
                  <p style={{ marginBottom: "0" }}>Epochs:</p>
                  <input
                    type="number"
                    value={props.advanceSetting.epochs}
                    onChange={(e) => handelAdvanceChange(e, "epochs")}
                  />
                  <div
                    style={{
                      position: "relative",
                      textAlign: "right",
                      width: "25px",
                    }}
                    onMouseEnter={() => setShowEpochsHelp(true)}
                    onMouseLeave={() => setShowEpochsHelp(false)}
                  >
                    <img width={"20px"} src={questionPng} alt="arrow down" />
                    <div
                      className={`${styles.epochsHelpDiv} ${
                        showEpochsHelp ? styles.epochsHelpDivShow : ""
                      }`}
                    >
                      <p>
                        One epoch means that each and every sample in the
                        training dataset has been fed through the training model
                        at least once. If your epochs are set to 50, for
                        example, it means that the model you are training will
                        work through the entire training dataset 50 times.
                        Generally the larger the number, the better your model
                        will learn to predict the data.
                      </p>
                      <p>
                        You probably want to tweak (usually increase) this
                        number until you get good predictive results with your
                        model.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.batchDiv}>
                <div className={styles.batchDivInr}>
                  <p style={{ marginBottom: "0" }}>Batch Size:</p>

                  <select
                    value={props.advanceSetting.batchSize}
                    onChange={(e) => handelAdvanceChange(e, "batchSize")}
                  >
                    <option value="16">16</option>
                    <option value="32">32</option>
                    <option value="64">64</option>
                    <option value="128">128</option>
                    <option value="256">256</option>
                    <option value="512">512</option>
                  </select>
                  <div
                    style={{
                      position: "relative",
                      textAlign: "right",
                      width: "25px",
                    }}
                    onMouseEnter={() => setShowBatchHelp(true)}
                    onMouseLeave={() => setShowBatchHelp(false)}
                  >
                    <img width={"20px"} src={questionPng} alt="arrow down" />
                    <div
                      className={`${styles.batchHelpDiv} ${
                        showBatchHelp ? styles.epochsHelpDivShow : ""
                      }`}
                    >
                      <p>
                        A batch is a set of samples used in one iteration of
                        training. For example, let's say that you have 80 images
                        and you choose a batch size of 16. This means the data
                        will be split into 80 / 16 = 5 batches. Once all 5
                        batches have been fed through the model, exactly one
                        epoch will be complete.
                      </p>
                      <p>
                        You probably won't need to tweak this number to get good
                        training results.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={styles.resetDiv}>
                <div onClick={handelReset} className={styles.resetDivInr}>
                  <p style={{ marginBottom: "0" }}>Reset Defaults</p>
                  <img width={"20px"} src={reset} alt="arrow down" />
                </div>
              </div>
            </div>

            <div
              style={{
                position: "relative",
              }}
            >
              <p
                onClick={handelTrain}
                className={styles["train_right_tainButton"]}
                style={
                  startTraining || Object.keys(classes).length < 2
                    ? { opacity: "0.5", cursor: "default" }
                    : {}
                }
              >
                Train Model
              </p>

              {/* {startTraining && (
                <div className={styles["trainLodarStyle"]} style={{}}>
                  <ColorRing />
                </div>
              )} */}
            </div>

            {/* ------------------- Advance Setting ----------------------------- */}

            {/* <div className={styles.advanceBtnDiv}>
                            <div
                                className={styles.advanceBtnInrDiv}
                                onClick={() => setShowAdvance(!showAdvance)}
                            >
                                Advance Settings
                                {showAdvance ? (
                                    <img
                                        width={'24px'}
                                        src={renderPrgImage('arrowUpActive')}
                                        alt="arrow down"
                                    />
                                ) : (
                                    <img
                                        width={'36px'}
                                        src={renderPrgImage('arrowDown')}
                                        alt="arrow down"
                                    />
                                )}
                            </div>
                        </div> */}
          </div>

          <button onClick={() => setShowCompareModel(true)}>compare</button>
        </div>
      </div>

      {/* ------------------- add button ----------------------------- */}
      {/* <div onClick={addClass} className={styles.TrainingClassAddButton}>
                Add Class
            </div> */}

      {/*--------------- Footer -------------------------*/}
      <div>
        <img
          src={buttonPlusImg}
          alt="next"
          draggable="false"
          style={{
            margin: 0,
            position: "absolute",
            top: "92vh",
            left: "50vw",
            width: "3vw",
            cursor: "pointer",
            transform: "translate(-50%, -50%)",
          }}
          onClick={addClass}
        />
      </div>
    </div>
  );
}

export default TrainMachine;
