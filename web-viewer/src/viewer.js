import React, { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";

const Viewer = () => {
  const viewer = useRef(null);
  useEffect(() => {
    console.log("1");
    handleWebViewer();
  }, []);

  const handleWebViewer = () => {
    let params={
        path: "http://localhost:8080/lib/",
        // path: "webviewer/lib/",
        //   config: "http://localhost:8080/config.js",
    }
      WebViewer(params,viewer.current)
        .then(async(response) => {
          console.log(response);
        })
        .catch((err) => {
          console.log("Error", err);
        });
    } 

  return (
    <div>
      <div className="webviewer" ref={viewer}></div>
    </div>
  );
};

export default Viewer;
