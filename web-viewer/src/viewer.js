import React, { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";
import { Button, Col, Container, Row } from 'reactstrap';
const Viewer = () => {
  const viewer = useRef(null);
  let instance;
  useEffect(() => {
    handleWebViewer();
  }, []);

  const handleWebViewer = async () => {
    let params = {
      path: "/webviewer/lib",
      config: "./config.js",
      initialDoc: "https://pdftron.s3.amazonaws.com/downloads/pl/webviewer-demo.pdf",
      disabledElements: [
        'ribbons',
        'toggleNotesButton',
        'searchButton',
        'menuButton',
        'rubberStampToolGroupButton',
        'stampToolGroupButton',
        'fileAttachmentToolGroupButton',
        'calloutToolGroupButton',
        'undo',
        'redo',
        'eraserToolButton', 'header'
      ],

    };
    WebViewer(params, viewer.current).then((response) => {
      console.log('reponse', response)
      instance = response;
    });

  };


  return (
    <Container>
      <Row>
        <Col xs='12'>
          <Button color="primary" size="lg">Large Button</Button>
        </Col>
        <Col xs='12'>
          <div className="webviewer" ref={viewer} style={{ height: "100vh" }}></div>
        </Col>
      </Row>
    </Container>
  );
};

export default Viewer;
