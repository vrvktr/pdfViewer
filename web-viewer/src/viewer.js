import React, { useEffect, useRef } from "react";
import WebViewer from "@pdftron/webviewer";
import { Button, Col, Container, Row } from 'reactstrap';
import { hasKeys } from "./common";

let instance;

const Viewer = () => {
  const viewer = useRef(null);

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


      const { Annotations } = instance.Core;

      instance.annotManager.on('annotationSelected',(annotations,action)=>{
        if(action==='selected'){
          instance.annotManager.trigger('annotationDoubleClicked')
        }
      })



      Annotations.SelectionModel.setSelectionModelPaddingHandler((annotation) => {

        if (annotation instanceof Annotations.FreeTextAnnotation) {

          return 30;

        }

        return 0;
      });



      Annotations.setCustomDrawHandler(Annotations.FreeTextAnnotation,

        function (ctx, pageMatrix, rotation, options) {

          options.originalDraw(ctx, pageMatrix, rotation);

          ctx.save();

          ctx.globalCompositeOperation = 'destination-over';

          ctx.moveTo(this.X, this.Y);

          drawBorder(this.X, this.Y, this.Width, this.Height);

          ctx.fillStyle = "#FFF";

          ctx.fillRect(this.X, this.Y, this.Width, this.Height);

          ctx.fillStyle = "#000";

          ctx.fillText('Text Field', this.X, this.Y + (this.Height + 15));

          ctx.restore();


          function drawBorder(xPos, yPos, width, height, thickness = 1) {

            ctx.fillStyle = '#bdbdbd';

            ctx.fillRect(

              xPos - (thickness),

              yPos - (thickness),

              width + (thickness * 2),

              height + (thickness * 2));

          }
        });

    });

  };

  // const dem = () => {
  //   const { Annotations } = instance.Core;

  //   Annotations.SelectionModel.setSelectionModelPaddingHandler((annotation) => {

  //     if (annotation instanceof Annotations.FreeTextAnnotation) {

  //       return 30;

  //     }

  //     return 0;
  //   });



  //   Annotations.setCustomDrawHandler(Annotations.FreeTextAnnotation,

  //     function (ctx, pageMatrix, rotation, options) {

  //       options.originalDraw(ctx, pageMatrix, rotation);

  //       ctx.save();

  //       ctx.globalCompositeOperation = 'destination-over';

  //       ctx.moveTo(this.X, this.Y);

  //       drawBorder(this.X, this.Y, this.Width, this.Height);

  //       ctx.fillStyle = "#FFF";

  //       ctx.fillRect(this.X, this.Y, this.Width, this.Height);

  //       ctx.fillStyle = "#000";

  //       ctx.fillText('Text Field', this.X, this.Y + (this.Height + 15));

  //       ctx.restore();


  //       function drawBorder(xPos, yPos, width, height, thickness = 1) {

  //         ctx.fillStyle = '#bdbdbd';

  //         ctx.fillRect(

  //           xPos - (thickness),

  //           yPos - (thickness),

  //           width + (thickness * 2),

  //           height + (thickness * 2));

  //       }
  //     });
  // }

  const addField = (type, point = {}, name = '', value = '', flag = {}) => {
    const { documentViewer, Annotations } = instance.Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const doc = documentViewer.getDocument();
    const displayMode = documentViewer.getDisplayModeManager().getDisplayMode();
    const page = displayMode.getSelectedPages(point, point);
    if (!!point.x && page.first == null) {
      return; //don't add field to an invalid page location
    }
    const page_idx =
      page.first !== null ? page.first : documentViewer.getCurrentPage();
    const page_info = doc.getPageInfo(page_idx);
    const page_point = displayMode.windowToPage(point, page_idx);
    const zoom = documentViewer.getZoomLevel();

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = page_idx;
    const rotation = documentViewer.getCompleteRotation(page_idx) * 90;
    textAnnot.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      textAnnot.Width = 50.0 / zoom;
      textAnnot.Height = 250.0 / zoom;
    } else {
      textAnnot.Width = 250.0 / zoom;
      textAnnot.Height = 50.0 / zoom;
    }
    textAnnot.X = (page_point.x || page_info.width / 2) - textAnnot.Width / 2;
    textAnnot.Y = (page_point.y || page_info.height / 2) - textAnnot.Height / 2;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    textAnnot.custom = {
      type,
      value,
      flag,
      name: `new`,
    };

    // set the type of annot
    textAnnot.setContents(textAnnot.custom.name);
    textAnnot.FontSize = '' + 20.0 / zoom + 'px';
    // textAnnot.FillColor = new Annotations.Color(211, 211, 211, 0.5);
    // textAnnot.TextColor = new Annotations.Color(0, 165, 228);
    textAnnot.StrokeThickness = 1;
    textAnnot.StrokeColor = new Annotations.Color(0, 165, 228);
    textAnnot.TextAlign = 'left';

    textAnnot.setRichTextStyle({
      0: {
        'font-weight': 'bold'
      }
    })

    textAnnot.Author = annotationManager.getCurrentUser();

    annotationManager.deselectAllAnnotations();
    annotationManager.addAnnotation(textAnnot, true);
    annotationManager.redrawAnnotation(textAnnot);
    annotationManager.selectAnnotation(textAnnot);
  };


  const insertAnnot = async (res) => {
    // await deleteAllAnnotation();
    const { docViewer, Annotations } = instance;
    const annotManager = docViewer.getAnnotationManager();
    const zoom = docViewer.getZoomLevel();
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
      let content = name
      let namelength = name.length + 1;

      textAnnot.setContents(content);
      textAnnot.disableRotationControl();
      textAnnot.FontSize = '' + 15.0 / zoom + 'px';
      // textAnnot.FillColor = new Annotations.Color(255, 255, 255, 1);
      textAnnot.TextColor = new Annotations.Color(18, 18, 20);
      textAnnot.StrokeThickness = 1;
      // textAnnot.StrokeColor = new Annotations.Color(197, 197, 199);
      textAnnot.TextAlign = 'left';

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
    let point = viewPointPage();
    y.xAxis = point.x;
    y.yAxis = point.y;
    y.pageNumber = 1;
    switch (action) {
      case 'add':
        addField(x.type, point, x)
        break;
      case 'insert':
        insertAnnot(y)
        break;
      case 'demo':
        demo();
        break;
    }
  }

  const demo = () => {
    const { Annotations, annotationManager, documentViewer } = instance.Core;
    const freeText = new Annotations.FreeTextAnnotation();
    freeText.PageNumber = 1;
    freeText.X = 150;
    freeText.Y = 200;
    freeText.Width = 150;
    freeText.Height = 50;
    freeText.setPadding(new Annotations.Rect(0, 0, 0, 0));
    freeText.setContents('My Text');
    freeText.FillColor = new Annotations.Color(0, 255, 255);
    freeText.FontSize = '16pt';

    annotationManager.addAnnotation(freeText, { autoFocus: false });
    annotationManager.redrawAnnotation(freeText);
  }

  const viewPointPage = () => {
    const { docViewer, annotManager, Annotations } = instance;
    const viewerElement = docViewer.getScrollViewElement();

    const top = viewerElement.scrollTop + viewerElement.offsetTop;
    const bottom = top + viewerElement.offsetHeight;
    const left = viewerElement.scrollLeft + viewerElement.offsetLeft;
    const right = left + viewerElement.offsetWidth;

    const windowCoordinateCenter = {
      x: (left + right) / 2,
      y: (top + bottom) / 2
    };

    const displayMode = docViewer.getDisplayModeManager().getDisplayMode();

    const pageNumber = getPageNumber(displayMode, windowCoordinateCenter);

    const pageCoordinates = displayMode.windowToPage(windowCoordinateCenter, pageNumber);

    return pageCoordinates;
  }

  const getPageNumber = (displayMode, windowCoordinates) => {
    const { docViewer, annotManager, Annotations } = instance;
    const page = displayMode.getSelectedPages(windowCoordinates, windowCoordinates);
    const clickedPage = (page.first !== null) ? page.first : docViewer.getCurrentPage();
    return clickedPage;

  }


  return (
    <Container>
      <Row>
        <Col xs='12'>
          {/* <Button color="primary" size="lg" onClick={() => handleAnnot('insert')}>Insert Annot</Button>
          <Button color="secondary" size="lg" onClick={() => handleAnnot('add')}>Add Field</Button> */}
          <Button color="secondary" size="lg" onClick={() => handleAnnot('demo')}>Demo</Button>
        </Col>
        <Col xs='12'>
          <div className="webviewer" ref={viewer} style={{ height: "100vh" }}></div>
        </Col>
      </Row>
    </Container>
  );
};

export default Viewer;
