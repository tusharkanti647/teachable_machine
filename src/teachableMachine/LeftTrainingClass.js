import editPencil from "../Assets/editPencil.png";
import photoUpload from "../Assets/photo-upload.svg";
import webCam from "../Assets/webCam.svg";
import deleteEnable from "../Assets/deleteEnable.svg";
import deletDisable from "../Assets/deletDisable.svg";
import eachImgCross from "../Assets/eachImgCross.svg";
import crossEnable from "../Assets/crossEnable.svg";
import crossDisable from "../Assets/crossDisable.svg";

import { useEffect, useRef, useState } from "react";
import styles from "./LeftTrainingClass.module.css";
// import { connect } from 'react-redux'
import { useIndexedDB } from "react-indexed-db";

function LeftTrainingClass(props) {
  const {
    jsPlumbInstance,
    obj,
    webCamModelOpen,
    audioModelOpen = () => {},
    isAudioTrain,
    // changeClasses,
    classesObjectKey,
    isShowClassDeleteBtn,
  } = props;
  const [className, setClassName] = useState(obj.className);
  const [isClassEdit, setIsClassEdit] = useState({
    isEdit: false,
    prevClassname: "",
  });

  const { getAll, getByIndex, deleteRecord } = useIndexedDB("SavedFaces");

  const menuContainerRef = useRef(null);
  const menuIconRef = useRef(null);

  const classes = isAudioTrain ? props.AudioClasses : props.ImageClasses;
  //change the redux state for edit the classname
  const handelChangeClassName = (e) => {
    return;
    try {
      e.preventDefault();

      let newClasses = { ...classes };
      newClasses[classesObjectKey] = { ...obj, className: className };

      if (isClassEdit.prevClassname !== className) {
        deleteFromIndexDB(isClassEdit.prevClassname);
      }

      setIsClassEdit({ isEdit: false, prevClassname: "" });
      let classType = isAudioTrain ? "AudioClasses" : "ImageClasses";

      //   changeClasses({ data: newClasses, classType });
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  //delete from indexDB
  const deleteFromIndexDB = (id) => {
    deleteRecord(id)
      .then(() => {
        console.log(`Record with ID '${id}' has been deleted.`);

        getAll().then((records) => {
          console.log(records);
        });
      })
      .catch((error) => {
        console.error("Error deleting record:", error);
      });
  };

  //delete the class
  const handelClassDelete = () => {
    return;
    try {
      if (!isShowClassDeleteBtn) {
        return;
      }
      if (Object.keys(classes).length <= 1) {
        return;
      }

      let newClasses = { ...classes };
      const leftDivId = `train_left-div-${obj.id}`;
      jsPlumbInstance?.deleteConnectionsForElement(leftDivId);

      delete newClasses[classesObjectKey];
      let classType = isAudioTrain ? "AudioClasses" : "ImageClasses";
      deleteFromIndexDB(className);
      //   changeClasses({ data: newClasses, classType });
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  //remove all the samples
  const handelRemoveSamples = () => {
    try {
      let selectedClassDetails = obj;
      selectedClassDetails.capturedImages = [];
      let newImageClasses = { ...props.ImageClasses };
      newImageClasses[classesObjectKey] = selectedClassDetails;
      props.setImageClasses(newImageClasses);
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  //remove only single image
  const removeSingleSample = (index) => {
    try {
      let selectedClassDetails = obj;
      let imgArr = selectedClassDetails.capturedImages;
      imgArr.splice(index, 1);
      selectedClassDetails.capturedImages = imgArr;
      //   setClasses({
      //     key: classesObjectKey,
      //     data: selectedClassDetails,
      //     classType: "ImageClasses",
      //   });
      let newImageClasses = { ...props.ImageClasses };
      newImageClasses[classesObjectKey] = selectedClassDetails;
      props.setImageClasses(newImageClasses);
    } catch (e) {
      console.error("ERROR", e);
    }
  };

  //--------------------------------------------------------------------------------------
  const containerRef = useRef(null);
  const [visibleCount, setVisibleCount] = useState(
    props.ImageClasses?.[classesObjectKey]?.capturedImages?.length
  );

  useEffect(() => {
    const calculateVisibleImages = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.offsetWidth;
        const imageWidth = 70; // fixed image width
        const gap = 15;
        const totalPerImage = imageWidth + gap;
        const count = Math.floor((containerWidth + gap) / totalPerImage);
        setVisibleCount(count);
      }
    };

    // Initial calculation
    calculateVisibleImages();

    // Recalculate on window resize
    window.addEventListener("resize", calculateVisibleImages);
    return () => window.removeEventListener("resize", calculateVisibleImages);
  }, []);

  const imagesToShow = props.ImageClasses?.[
    classesObjectKey
  ]?.capturedImages?.slice(0, visibleCount);
  const remainingCount =
    props?.ImageClasses[classesObjectKey]?.capturedImages?.length -
    visibleCount;
  //--------------------------------------------------------------------------------------

  return (
    <div>
      <div className={styles.trainClassHeader}>
        <div className={styles.trainClassNameDiv}>
          {isClassEdit.isEdit ? (
            <form onSubmit={handelChangeClassName}>
              <input
                className={styles.classnameInput}
                value={className}
                placeholder="Enter The Class Name"
                onChange={(e) => setClassName(e.target.value)}
              />
            </form>
          ) : (
            <>
              <p
                style={{
                  marginBottom: "0",
                  marginRight: "8px",
                }}
              >
                {obj.className}{" "}
              </p>
              <div style={{ position: "relative" }}>
                <img
                  id={styles.editPencilImg}
                  width={"28px"}
                  style={{ cursor: "pointer" }}
                  src={editPencil}
                  alt="edit class name"
                  onClick={() =>
                    setIsClassEdit({
                      isEdit: true,
                      prevClassname: className,
                    })
                  }
                />
                <div className={`${styles.tooltipDiv} ${styles.pencilToolTip}`}>
                  Edit Class Name
                </div>
              </div>
            </>
          )}
        </div>

        <div className={styles.menuParentDiv}>
          <div style={{ position: "relative" }}>
            <img
              ref={menuIconRef}
              id={styles.uploadImg}
              style={{ cursor: "pointer" }}
              src={photoUpload}
              alt="Upload"
              onClick={() =>
                webCamModelOpen({
                  value: true,
                  imageUpload: true,
                  classesObjectKey: classesObjectKey,
                })
              }
            />
            <div className={`${styles.tooltipDiv} ${styles.uploadToolTip}`}>
              Upload
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <img
              ref={menuIconRef}
              id={styles.webCamImg}
              style={{ cursor: "pointer" }}
              src={webCam}
              alt="Webcam"
              onClick={() =>
                webCamModelOpen({
                  value: true,
                  imageUpload: false,
                  classesObjectKey: classesObjectKey,
                })
              }
            />
            <div className={`${styles.tooltipDiv} ${styles.webCamToolTip}`}>
              Webcam
            </div>
          </div>
          <div style={{ position: "relative" }}>
            <img
              ref={menuIconRef}
              id={styles.deleteClassImg}
              style={
                isShowClassDeleteBtn
                  ? { cursor: "pointer" }
                  : { cursor: "default" }
              }
              src={isShowClassDeleteBtn ? deleteEnable : deletDisable}
              alt="Delete class"
              onClick={() => handelClassDelete()}
            />
            <div
              className={`${styles.tooltipDiv} ${styles.deleteClassToolTip}`}
            >
              Delete class
            </div>
          </div>
          {/* <div
                        ref={menuContainerRef}
                        className={
                            isShowMenu
                                ? `${styles.menuDiv} ${styles.active}`
                                : `${styles.menuDiv} `
                        }
                    >
                        <p onClick={handelClassDelete}>Delete Class</p>
                        <p onClick={handelRemoveSamples}>Remove All Samples</p>
                    </div> */}
        </div>
      </div>
      {/* <p>Add Samples:</p> */}
      <div
        // style={{ border: '1px solid red' }}
        className={styles.trainClassBodyDiv}
      >
        <div className={styles.samplesDivParent}>
          <div className={styles.samplesDiv} ref={containerRef}>
            {imagesToShow.map((img, index) => (
              <div key={index} className={styles.sampleImgDiv}>
                <img
                  src={img}
                  width="70"
                  height="70"
                  alt={`Captured ${index}`}
                  className={styles.sampleImage}
                />
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
          </div>
          {remainingCount > 0 && (
            <div className={styles.moreImages}>+{remainingCount}</div>
          )}
        </div>

        <div style={{ position: "relative" }}>
          <img
            ref={menuIconRef}
            id={styles.deleteAllImg}
            style={
              imagesToShow.length > 0
                ? { cursor: "pointer" }
                : { cursor: "default" }
            }
            src={imagesToShow.length > 0 ? crossEnable : crossDisable}
            alt="Delete all samples"
            onClick={() => handelRemoveSamples()}
          />
          <div className={`${styles.tooltipDiv} ${styles.deleteAllToolTip}`}>
            Delete all samples
          </div>
        </div>
        {/* {!isAudioTrain && (
                    <div
                        onClick={() =>
                            webCamModelOpen({
                                value: true,
                                imageUpload: false,
                                classesObjectKey: classesObjectKey,
                            })
                        }
                        className={styles.webCamDiv}
                    >
                        <img src={renderPrgImage('webcam')} alt="webCam" />
                        <p>Webcam</p>
                    </div>
                )}
                {!isAudioTrain && (
                    <div
                        onClick={() =>
                            webCamModelOpen({
                                value: true,
                                imageUpload: true,
                                classesObjectKey: classesObjectKey,
                            })
                        }
                        className={styles.webCamDiv}
                    >
                        <img
                            src={renderPrgImage('teachableMachineUploadIcon')}
                            alt="upload"
                        />
                        <p>Upload</p>
                    </div>
                )} */}

        {/* {isAudioTrain && (
                    <div
                        onClick={() =>
                            audioModelOpen({
                                value: true,
                                audioUpload: false,
                                className: obj.className,
                            })
                        }
                        className={styles.webCamDiv}
                    >
                        <img
                            src={renderPrgImage('teachableMachineMic')}
                            alt="upload"
                        />
                        <p>Mic</p>
                    </div>
                )} */}
      </div>
    </div>
  );
}

export default LeftTrainingClass;
