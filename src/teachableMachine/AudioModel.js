// import React, { useEffect, useRef, useState } from 'react'
// import * as tf from '@tensorflow/tfjs'
// import styles from './TrainMachine.module.css'
// import { useIndexedDB } from 'react-indexed-db'
// import renderImage from '../../../source/importImg'

// const NUM_FRAMES = 43 // Number of frames for each audio sample
// const SAMPLE_RATE = 44100 // Sample rate for the audio input
// let allAudioFeatures = []

// let recognition = undefined

// function AudioModule(props) {
//     const {
//         className = '',
//         isShow = false,
//         handleDialogModalClose = () => {},
//         classes,
//         setClasses,
//     } = props

//     const [isRecording, setIsRecording] = useState(false)

//     const [recordings, setRecordings] = useState([])
//     const [recognizedText, setRecognizedText] = useState([])
//     const mediaRecorderRef = useRef(null)
//     const audioChunksRef = useRef([])

//     const startRecording = () => {
//         audioChunksRef.current = []
//         navigator.mediaDevices
//             .getUserMedia({ audio: true })
//             .then((stream) => {
//                 mediaRecorderRef.current = new MediaRecorder(stream)
//                 mediaRecorderRef.current.ondataavailable = (event) => {
//                     audioChunksRef.current.push(event.data)
//                 }
//                 mediaRecorderRef.current.onstop = () => {
//                     const audioBlob = new Blob(audioChunksRef.current, {
//                         type: 'audio/wav',
//                     })
//                     const audioUrl = URL.createObjectURL(audioBlob)
//                     setRecordings((prevRecordings) => [
//                         ...prevRecordings,
//                         audioUrl,
//                     ])
//                 }
//                 mediaRecorderRef.current.start()
//                 setIsRecording(true)
//             })
//             .catch((error) => {
//                 console.error('Error accessing audio device:', error)
//             })
//     }

//     const stopRecording = () => {
//         if (mediaRecorderRef.current && isRecording) {
//             mediaRecorderRef.current.stop()
//             setIsRecording(false)
//         }
//     }

//     const recognizeAudio = () => {
//         const recognition = new (window.SpeechRecognition ||
//             window.webkitSpeechRecognition)()
//         recognition.lang = 'en-US' // Set language for recognition

//         const recognizeRecording = (audioUrl) => {
//             return new Promise((resolve, reject) => {
//                 const audio = new Audio(audioUrl)
//                 audio.play()

//                 // Start recognition after the audio starts playing
//                 audio.onplay = () => {
//                     recognition.start()
//                 }

//                 recognition.onresult = (event) => {
//                     let speechInput =
//                         event.results[event.resultIndex][0].transcript
//                     // const transcript = event.results[0][0].transcript
//                     resolve(speechInput)
//                 }

//                 recognition.onerror = (error) => {
//                     reject(error)
//                 }
//             })
//         }

//         const processAllRecordings = async () => {
//             const texts = []
//             for (let audioUrl of recordings) {
//                 try {
//                     const text = await recognizeRecording(audioUrl)
//                     texts.push(text)
//                 } catch (error) {
//                     console.error('Recognition error:', error)
//                 }
//             }
//             setRecognizedText(texts)
//         }

//         processAllRecordings()
//     }

//     return (
//         <>
//             {isShow && (
//                 <div className={styles.webCamModel}>
//                     <div className={styles.webCamModelInner}>
//                         {/* --------- close button --------------- */}
//                         <img
//                             className={styles.WebCamModelCloseBtn}
//                             src={renderImage('clos')}
//                             onClick={() => {
//                                 // stopWebcam()
//                                 // setStartCam(false)
//                                 // clsoeSave()
//                                 handleDialogModalClose()
//                             }}
//                             alt="Close"
//                         />

//                         <div>
//                             <button
//                                 onClick={
//                                     isRecording ? stopRecording : startRecording
//                                 }
//                             >
//                                 {isRecording
//                                     ? 'Stop Recording'
//                                     : 'Start Recording'}
//                             </button>

//                             <div>
//                                 <h3>Recorded Audios:</h3>
//                                 {recordings.map((audioUrl, index) => (
//                                     <div key={index}>
//                                         <p>Recording {index + 1}</p>
//                                         <audio controls>
//                                             <source
//                                                 src={audioUrl}
//                                                 type="audio/wav"
//                                             />
//                                             Your browser does not support the
//                                             audio element.
//                                         </audio>
//                                     </div>
//                                 ))}
//                             </div>

//                             <button onClick={recognizeAudio}>
//                                 Recognize Audio
//                             </button>

//                             <div>
//                                 <h3>Recognized Text:</h3>
//                                 {recognizedText.length > 0 ? (
//                                     recognizedText.map((text, index) => (
//                                         <p key={index}>{`Audio ${
//                                             index + 1
//                                         }: ${text}`}</p>
//                                     ))
//                                 ) : (
//                                     <p>No text recognized yet.</p>
//                                 )}
//                             </div>
//                         </div>

//                         {/* <div>
//                             <div className={styles.webCamModelCameraDiv}></div>
//                             <div className={styles.webCamModelBtnDiv}>

//                                 <button
//                                     onClick={startRecording}
//                                     className={styles.capturePhotoBtn}
//                                 >
//                                     {isRecording
//                                         ? 'Stop Recording'
//                                         : 'Start Recording'}
//                                 </button>
//                             </div>
//                         </div> */}
//                         {/* <div className={styles.audioControlButtons}>
//                             <button
//                                 onClick={
//                                     isRecording ? stopRecording : startRecording
//                                 }
//                                 className={styles.audioControlButton}
//                             >
//                                 {isRecording
//                                     ? 'Stop Recording'
//                                     : 'Start Recording'}
//                             </button>
//                             <button
//                                 // onClick={handleAudioCapture}
//                                 className={styles.audioControlButton}
//                             >
//                                 Capture Audio
//                             </button>
//                         </div> */}

//                         {/* <div className={styles.capturedFeaturesList}>
//                             {classes[className].audioFeatures?.map(
//                                 (feature, index) => (
//                                     <div key={index}>
//                                         <p>Audio Feature {index + 1}</p>
//                                     </div>
//                                 )
//                             )}
//                         </div> */}
//                     </div>
//                 </div>
//             )}
//         </>
//     )
// }

// export default AudioModule
