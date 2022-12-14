import React, { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";
import { Button, Col, Container, Row } from 'reactstrap';
import { hasKeys } from "./common";

const Viewer = () => {
  const viewer = useRef(null);
  let instance;

  let customFields = [
    { author: "Custom", color: "blue", draggable: true, editable: false, category: "Utilities", id: "Radiobutton", label: "Radiobutton", name: "Radiobutton", type: "radio" },
    { author: "Custom", color: "blue", draggable: true, editable: false, category: "Utilities", id: "Checkbox", label: "Checkbox", name: "Checkbox", type: "checkbox" },
    { author: "Custom", color: "blue", draggable: true, editable: false, category: "Utilities", id: "Strikethrough", label: "Strikethrough", name: "Strikethrough", type: "strikethrough" },
    { author: "Custom", color: "blue", draggable: true, editable: false, category: "Utilities", id: "Plain Text Area", label: "Plain Text Area", name: "Plain Text Area", type: "plainTextArea" },
  ]



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
      var FitMode = instance.UI.FitMode;
			instance.UI.setFitMode(FitMode.FitWidth);



      instance.Annotations.setCustomDrawHandler(instance.Annotations.FreeTextAnnotation, function (ctx, pageMatrix, rotation, options) {
				const { annotation, originalDraw } = options;
				console.log("annotation", annotation);
				// console.log("ctx", ctx);
				const x = annotation.X;
				const y = annotation.Y;
				let width = annotation.getWidth();
				let height = annotation.getHeight();

        options.originalDraw(ctx, pageMatrix, rotation);
        ctx.save();
        ctx.lineWidth = 20;
        ctx.lineJoin = "round";
        ctx.strokeStyle = "#E2EAFFB3";
        ctx.strokeRect(x - 10, y - 10, width + 20, height + 20);
        ctx.fillStyle = '#000000';
        ctx.translate(x - 10, y - 10);
        ctx.restore();


			
			});




    });

  };

  const addField = async (type, point = {}, data = {}, value = '', flag = {}) => {
    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const doc = docViewer.getDocument();
    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx = page.first !== null ? page.first : docViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = docViewer.getZoom();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = docViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    let width, height;
    if (rotation === 270 || rotation === 90) {
      width = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : 50.0 / zoom;
      height = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : type.toUpperCase() === 'STRIKETHROUGH' ? 2 : 250.0 / zoom;
    } else {
      height = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : type.toUpperCase() === 'STRIKETHROUGH' ? 2 : 50.0 / zoom;
      width = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : 250.0 / zoom;
    }
    textAnnot.Width = width;
    textAnnot.Height = height;
    // textAnnot.NoResize = true;
    textAnnot.setAutoSizeType('FIXED_HEIGHT');
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    let category = hasKeys(data) && hasKeys(data.category) ? data.category : ''
    textAnnot.custom = {
      type,
      value,
      flag,
      name: data.name,
      label: data.label,
      author: hasKeys(data.author) ? data.author : 'Guest',
      category,
      token: data.token,
      editMode: false,
    };
    let contentName = data.name || "";
    let content = `${contentName}\n\t${category}`
    textAnnot.setContents(content);
    textAnnot.disableRotationControl();
    textAnnot.FontSize = '' + 15.0 / zoom + 'px';
    textAnnot.FillColor = new Annotations.Color(255, 255, 255, 1);
    textAnnot.TextColor = new Annotations.Color(18, 18, 20);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(197, 197, 199);
    textAnnot.TextAlign = 'left';
   
    let namelength = contentName.length + 1;


    textAnnot.Author = annotManager.getCurrentUser();

    annotManager.deselectAllAnnotations();
    annotManager.addAnnotation(textAnnot, true);
    annotManager.redrawAnnotation(textAnnot);
    // annotManager.selectAnnotation(textAnnot);
  };

  const insertAnnot = async (res) => {
    // await deleteAllAnnotation();
    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const zoom = docViewer.getZoom();
    const totalPages = docViewer.getPageCount();
    let { type, xAxis, yAxis, pageNumber, name, contents, label, token } = res;
    let category = res.category || ""
    if (pageNumber <= totalPages) {
      let value = "";
      let flag = {};
      let width = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : type.toUpperCase() === 'STRIKETHROUGH' ? 2 : res.width;
      let height = type.toUpperCase() === 'CHECKBOX' || type.toUpperCase() === 'RADIO' ? 20 : type.toUpperCase() === 'STRIKETHROUGH' ? 2 : res.height;
      var textAnnot = new Annotations.FreeTextAnnotation(name, {
        PageNumber: pageNumber,
        X: xAxis,
        Y: yAxis,
        Width: width,
        Height: height
      });
      textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
      textAnnot.custom = {
        type,
        value,
        flag,
        name,
        label,
        author: hasKeys(res.author) ? res.author : 'Guest',
        category,
        token,
        editMode: false,
      };
      let content = `\t${name}\n\t${category}`
      let namelength = name.length + 1;

      textAnnot.setContents(content);
      textAnnot.disableRotationControl();
      textAnnot.FontSize = '' + 15.0 / zoom + 'px';
      textAnnot.FillColor = new Annotations.Color(255, 255, 255, 1);
      textAnnot.TextColor = new Annotations.Color(18, 18, 20);
      textAnnot.StrokeThickness = 1;
      textAnnot.StrokeColor = new Annotations.Color(197, 197, 199);
      textAnnot.TextAlign = 'left';
      textAnnot.AutoSizeTypes = 'FIXED_HEIGHT';

      textAnnot.Author = annotManager.getCurrentUser();
      

      annotManager.deselectAllAnnotations();
      annotManager.addAnnotation(textAnnot, true);
      annotManager.redrawAnnotation(textAnnot);
      // annotManager.selectAnnotation(textAnnot);
    }
  }

  const handleAnnot = (action) => {
    let x = customFields[0];
    let y = customFields[1];
    const { docViewer } = instance;
    const scrollElement = docViewer.getScrollViewElement();
    const scrollLeft = scrollElement.scrollLeft || 0;
    const scrollTop = scrollElement.scrollTop || 0;
    const scrollOffset = 200;
    const dropAxis = { x: scrollLeft + scrollOffset, y: scrollTop + scrollOffset };
    y.xAxis = dropAxis.x;
    y.yAxis = dropAxis.y;
    switch (action) {
      case 'add':
        addField(x.type, dropAxis, x)
        break;
      case 'insert':
        insertAnnot(y)
        break;
    }
  }


  return (
    <Container>
      <Row>
        <Col xs='12'>
          <Button color="primary" size="lg" onClick={() => handleAnnot('insert')}>Insert Annot</Button>
          <Button color="secondary" size="lg" onClick={() => handleAnnot('add')}>Add Field</Button>
        </Col>
        <Col xs='12'>
          <div className="webviewer" ref={viewer} style={{ height: "100vh" }}></div>
        </Col>
      </Row>
    </Container>
  );
};

export default Viewer;
