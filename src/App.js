import logo from "./logo.svg";
import "./App.css";
import TrainMachine from "./teachableMachine/TrainMachine";

import { initDB, useIndexedDB } from "react-indexed-db";
import { useState } from "react";

const randomNumberGenerator = () =>
  Math.floor(Math.random() * (99999999 - 10000000 + 1)) + 10000000;

export const DBConfig = {
  name: "ProgrammingPage",
  version: 1,
  objectStoresMeta: [
    {
      store: "ProgramData",
      storeConfig: { keyPath: "id", autoIncrement: false },
      storeSchema: [
        {
          imageURL: "imageURL",
          keypath: "imageURL",
          options: { unique: false },
        },
      ],
    },
    {
      store: "SavedFaces",
      storeConfig: { keyPath: "id" },
      storeSchema: [
        {
          imageURL: "imageURL",
          imageTensors: "imageTensors",
          keypath: "imageURL",
          options: { unique: false },
        },
      ],
    },
  ],
};
initDB(DBConfig);

function App() {
  const [ImageClasses, setImageClasses] = useState({
    Class_1: {
      id: randomNumberGenerator(),
      className: "Class 1",
      sampleType: "Image",
      indexedDbId: "Class 1",
      capturedImages: [],
    },
  });
  const [AudioClasses, setAudioClasses] = useState({
    Class1: {
      id: randomNumberGenerator(),
      className: "Class 1",
      sampleType: "Audio",
      indexedDbId: "Class 1",
      capturedAudio: [],
    },
  });
  const [advanceSetting, setAdvanceSetting] = useState({
    epochs: 50,
    batchSize: 16,
  });

  const [isEnableNextBtn, setIsEnableNextBtn] = useState(false);

  return (
    <div className="App">
      <TrainMachine
        ImageClasses={ImageClasses}
        setImageClasses={setImageClasses}
        AudioClasses={AudioClasses}
        setAudioClasses={setAudioClasses}
        advanceSetting={advanceSetting}
        setAdvanceSetting={setAdvanceSetting}
        isEnableNextBtn={isEnableNextBtn}
        setIsEnableNextBtn={setIsEnableNextBtn}
      />
    </div>
  );
}

export default App;
