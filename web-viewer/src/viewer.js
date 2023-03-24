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
        // 'ribbons',
        // 'toggleNotesButton',
        // 'searchButton',
        // 'menuButton',
        // 'rubberStampToolGroupButton',
        // 'stampToolGroupButton',
        // 'fileAttachmentToolGroupButton',
        // 'calloutToolGroupButton',
        // 'undo',
        // 'redo',
        // 'eraserToolButton', 'header'
      ],

    };
    WebViewer(params, viewer.current).then((response) => {
      console.log('reponse', response)
      instance = response;
      var FitMode = instance.UI.FitMode;
      let selectedAnnotation = null;

      let currentAnnot = null;
      let signedAnnot = null;
      let existingSignature = null;

      // instance.UI.setFitMode(FitMode.FitWidth);
      const { Feature } = instance.UI;
      instance.UI.enableFeatures([Feature.FilePicker]);

      const { Annotations, annotationManager } = instance.Core;


      instance.annotationPopup.add([{
        type: 'actionButton',
        label: 'Edit',
        dataElement: 'editField',
        onClick: () => changeSignature(selectedAnnotation)
      }])




      const allTools = Object.values(instance.docViewer.getToolModeMap());
      for (const tool of allTools) {
        if (tool instanceof instance.Tools.AnnotationSelectTool) {
          tool.enableImmediateActionOnAnnotationSelection();
        }
      }


      instance.Annotations.setCustomDrawHandler(instance.Annotations.FreeTextAnnotation, function (ctx, pageMatrix, rotation, options) {
        const { annotation, originalDraw } = options
        const x = annotation.X;
        const y = annotation.Y;
        const width = annotation.getWidth();
        const height = annotation.getHeight();
        let { name, label, value } = annotation.custom;
        label = label ? label : "new";
        name = name ? name : "new";
        value = value ? value : "new";
        const annot = options.annotation;

        // Draw annotation ID overtop the rectangle
        ctx.beginPath();
        annotation.setStyles(ctx, pageMatrix)
        ctx.lineWidth = 2;
        ctx.save();
        ctx.translate(x, y)
        ctx.beginPath();
        ctx.strokeStyle = "#091C3F";
        ctx.roundRect(0, 0, width, height, 2)
        ctx.stroke()
        ctx.fill()
        ctx.closePath()
        ctx.fillText(annotation.Id, 0, height + 8)
        ctx.restore()
        ctx.clip()

      })

      instance.Annotations.SelectionModel.setSelectionModelPaddingHandler((annotation) => {
        return 20;
      })


      annotationManager.addEventListener('annotationSelected', (annotations, action) => {
        if (action === 'selected') {
          let annot = annotations[0];
          if (hasKeys(annot) && (annot.ToolName === 'AnnotationCreateFreeHand' || annot.ToolName === 'AnnotationCreateRubberStamp') && annot.Subject === 'Signature') {
            selectedAnnotation = annotations;
          }
        }
      })
      const signatureTool = instance.Core.documentViewer.getTool('AnnotationCreateSignature');

      signatureTool.addEventListener('locationSelected', async (options, annotation) => {
        const savedSignature = signatureTool.getSavedSignatures()[0];
        if (savedSignature) {
          await signatureTool.setSignature(savedSignature);
          await signatureTool.addSignature();
          instance.UI.closeElements(['signatureModal']);
        }
      });

      signatureTool.addEventListener('signatureSaved', (newAnnot) => {
        setTimeout(async () => {
          signatureTool.switchOut(); const savedSignature = signatureTool.getSavedSignatures(); if (currentAnnot != null) {
            let currentSignedAnnotation = annotationManager.getAnnotationsList().filter(a => a instanceof instance.Annotations.SignatureWidgetAnnotation && !a.getAssociatedSignatureAnnotation() && a.Id === currentAnnot.Id); let signedAnnotation = []
            if (signedAnnot.length > 0) { signedAnnotation = signedAnnot.filter((a) => a => a instanceof instance.Annotations.SignatureWidgetAnnotation && !a.getAssociatedSignatureAnnotation() && a.Id !== currentAnnot.Id); } if (signedAnnotation.length > 0) { currentSignedAnnotation = [...currentSignedAnnotation, ...signedAnnotation] }
            currentSignedAnnotation.forEach(widget => {
              const copiedAnnotation = annotationManager.getAnnotationCopy(savedSignature[0]); widget.setAssociatedSignatureAnnotation(copiedAnnotation); copiedAnnotation.PageNumber = widget.PageNumber; copiedAnnotation.X = widget.X; copiedAnnotation.Y = widget.Y; copiedAnnotation.Height = widget.Height; if (copiedAnnotation.Width > widget.Width) { copiedAnnotation.Width = existingSignature != null ? existingSignature.width : widget.Width; } annotationManager.addAnnotation(copiedAnnotation);
            });
            currentAnnot = null; signedAnnot = null; existingSignature = null; instance.UI.setToolMode('AnnotationEdit');
          }
        }, 100)
      });



      const changeSignature = async (selectAnnotations) => {
        const allAnnotation = annotationManager.getAnnotationsList();
        const currentSignatureAnnotation = allAnnotation.find(a => a instanceof instance.Annotations.SignatureWidgetAnnotation && hasKeys(a.getAssociatedSignatureAnnotation()) && a.getAssociatedSignatureAnnotation().Id === selectAnnotations[0].Id)
        currentAnnot = currentSignatureAnnotation;
        const signatureCount = signatureTool.getSavedSignatures().length;
        const savedSignature = currentSignatureAnnotation.getAssociatedSignatureAnnotation();
        existingSignature = { height: savedSignature.Height, width: savedSignature.Width };
        for (let i = signatureCount - 1; i >= 0; i--) { signatureTool.deleteSavedSignature(i); }
        handleDeleteAnnotation(selectAnnotations, 'delete')
        const signatureWidgets = instance.annotManager.getAnnotationsList().filter((annot) => annot instanceof instance.Annotations.SignatureWidgetAnnotation && hasKeys(annot.getAssociatedSignatureAnnotation()))
        //deleting all the signeed fields;
        signedAnnot = signatureWidgets; signatureWidgets.forEach((annot) => { handleDeleteAnnotation([annot.getAssociatedSignatureAnnotation()], 'delete') })
        signatureTool.clearSignatureCanvas(); await signatureTool.setSignature(null); await signatureTool.addSignature();
        // instance.UI.openElement('signatureModal')        
        signatureTool.trigger('locationSelected', [{ pageNumber: currentAnnot.PageNumber, x: currentAnnot.x + 10, y: currentAnnot.y + 10 }, currentSignatureAnnotation]);
      }



    });

  };

  const handleDeleteAnnotation = (annotations, action) => {
    const { Annotations, annotationManager } = instance.Core;
    const allAnnotation = annotationManager.getAnnotationsList();
    if (hasKeys(annotations) && action === 'delete') {
      let annotationIds = [];
      allAnnotation.map((annot) => {
        annotationIds.push(annot.Id)

      })
      let annotsToDelete = []
      Promise.all(allAnnotation.map((annot) => {
        const id = annot.Id;
        if (annotationIds.includes(id)) {
          annotsToDelete.push(annot)
          const signatureWidgets = instance.annotManager.getAnnotationsList().find((annot) =>
            annot instanceof instance.Annotations.SignatureWidgetAnnotation &&
            annot.getAssociatedSignatureAnnotation() && annot.getAssociatedSignatureAnnotation().Id === id)
          if (signatureWidgets) {
            signatureWidgets.setAssociatedSignatureAnnotation(null);
          }

        }
      }))

      if (hasKeys(annotsToDelete)) {
        instance.annotManager.deleteAnnotations(annotsToDelete);
      }

    }
  }


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
    console.log(res);
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
    const zoom = documentViewer.getZoomLevel();

    const freeText = new Annotations.FreeTextAnnotation();
    freeText.PageNumber = 1;
    freeText.X = 150;
    freeText.Y = 200;
    const rotation = documentViewer.getCompleteRotation(1) * 90;
    freeText.Rotation = rotation;
    if (rotation === 270 || rotation === 90) {
      freeText.Width = 50.0 / zoom;
      freeText.Height = 250.0 / zoom;
    } else {
      freeText.Width = 250.0 / zoom;
      freeText.Height = 50.0 / zoom;
    }
    freeText.setPadding(new Annotations.Rect(0, 0, 0, 0));
    freeText.setContents('My Text');
    freeText.setCustomData('trn-annot-clickable-oustside-rect', 'true');
    freeText.FillColor = new Annotations.Color(0, 255, 255);
    freeText.FontSize = '16pt';
    freeText.custom = {
      type: "RADIO"
    }

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
  const newFun = () => {
    const { documentViewer, annotationManager, Annotations } = instance.Core;

    var textAnnot = new Annotations.FreeTextAnnotation();
    textAnnot.PageNumber = 1;
    textAnnot.Width = 225;
    textAnnot.Height = 49;
    textAnnot.X = 100
    textAnnot.Y = 100;

    textAnnot.setPadding(new Annotations.Rect(0, 0, 0, 0));
    var customData = {
      value: 'Type your text here',
      isDefault: true
    };
    textAnnot.setCustomData(JSON.stringify(customData));
    textAnnot.setContents('');
    textAnnot.setAutoSizeType('AUTO')
    textAnnot.custom = {
      type: 'RADIO',
    };
    console.log('textAnnot', textAnnot);
    annotationManager.addAnnotation(textAnnot);
    annotationManager.redrawAnnotation(textAnnot);
  }

  const applyFields = async () => {
    const { Annotations, documentViewer } = instance.Core;
    const annotationManager = documentViewer.getAnnotationManager();
    const fieldManager = annotationManager.getFieldManager();
    const annotationsList = annotationManager.getAnnotationsList();
    const annotsToDelete = [];
    const annotsToDraw = [];

    await Promise.all(
      annotationsList.map(async (annot, index) => {
        let inputAnnot;
        let field;

        if (typeof annot.custom !== 'undefined') {
          // create a form field based on the type of annotation
          if (annot.custom.type === 'TEXT') {
            field = new Annotations.Forms.Field(
              annot.getContents() + Date.now() + index,
              {
                type: 'Tx',
                value: annot.custom.value,
              },
            );
            inputAnnot = new Annotations.TextWidgetAnnotation(field);
          } else if (annot.custom.type === 'SIGNATURE') {
            field = new Annotations.Forms.Field(
              annot.getContents() + Date.now() + index,
              {
                type: 'Sig',
              },
            );
            inputAnnot = new Annotations.SignatureWidgetAnnotation(field, {
              appearance: '_DEFAULT',
              appearances: {
                _DEFAULT: {
                  Normal: {
                    data:
                      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAYdEVYdFNvZnR3YXJlAHBhaW50Lm5ldCA0LjEuMWMqnEsAAAANSURBVBhXY/j//z8DAAj8Av6IXwbgAAAAAElFTkSuQmCC',
                    offset: {
                      x: 100,
                      y: 100,
                    },
                  },
                },
              },
            });
          } else if (annot.custom.type === 'DATE') {
            field = new Annotations.Forms.Field(
              annot.getContents() + Date.now() + index,
              {
                type: 'Tx',
                value: 'm-d-yyyy',
                // Actions need to be added for DatePickerWidgetAnnotation to recognize this field.
                actions: {
                  F: [
                    {
                      name: 'JavaScript',
                      // You can customize the date format here between the two double-quotation marks
                      // or leave this blank to use the default format
                      javascript: 'AFDate_FormatEx("mmm d, yyyy");',
                    },
                  ],
                  K: [
                    {
                      name: 'JavaScript',
                      // You can customize the date format here between the two double-quotation marks
                      // or leave this blank to use the default format
                      javascript: 'AFDate_FormatEx("mmm d, yyyy");',
                    },
                  ],
                },
              },
            );

            inputAnnot = new Annotations.DatePickerWidgetAnnotation(field);
          } else if (annot.custom.type === 'RADIO') {
            const flags = new Annotations.WidgetFlags();
            flags.set('ReadOnly', true)
            field = new Annotations.Forms.Field(
              annot.getContents() + Date.now() + index,
              {
                type: 'Btn',
                value: "Yes",
                flags
              },
            );
            inputAnnot = new Annotations.RadioButtonWidgetAnnotation(field, {
              appearance: 'Off',
              appearances: {
                Off: {},
                Yes: {},
              },
              captions: {
                Normal: ""
              }
            });
          } else {
            // exit early for other annotations
            annotationManager.deleteAnnotation(annot, false, true); // prevent duplicates when importing xfdf
            return;
          }
        } else {
          // exit early for other annotations
          return;
        }

        // set position
        inputAnnot.PageNumber = annot.getPageNumber();
        inputAnnot.X = annot.getX();
        inputAnnot.Y = annot.getY();
        inputAnnot.rotation = annot.Rotation;
        if (annot.Rotation === 0 || annot.Rotation === 180) {
          inputAnnot.Width = annot.getWidth();
          inputAnnot.Height = annot.getHeight();
        } else {
          inputAnnot.Width = annot.getHeight();
          inputAnnot.Height = annot.getWidth();
        }

        // delete original annotation
        annotsToDelete.push(annot);

        // customize styles of the form field
        Annotations.WidgetAnnotation.getCustomStyles = function (widget) {
          if (widget instanceof Annotations.SignatureWidgetAnnotation) {
            return {
              border: '1px solid #a5c7ff',
            };
          }
          if (widget instanceof Annotations.RadioButtonWidgetAnnotation) {
            return {
              border: '2px solid #091C3F',
              backgroundColor: '#FFFFFF'

            }
          }
        };
        Annotations.WidgetAnnotation.getCustomStyles(inputAnnot);

        // draw the annotation the viewer
        annotationManager.addAnnotation(inputAnnot);
        fieldManager.addField(field);
        annotsToDraw.push(inputAnnot);
      }),
    );

    // delete old annotations
    annotationManager.deleteAnnotations(annotsToDelete, null, true);

    // refresh viewer
    await annotationManager.drawAnnotationsFromList(annotsToDraw);
  };



  return (
    <Container>
      <Row>
        <Col xs='12'>
          {/* <Button color="secondary" size="lg" onClick={() => applyFields()}>Apply Fields</Button>
          <Button color="secondary" size="lg" onClick={() => newFun()}>Create Sign Fields</Button>
          <Button color="primary" size="lg" onClick={() => handleAnnot('insert')}>HandleAnnot</Button> */}
          <Button color="primary" size="lg" onClick={() => demo()}>demo</Button>
        </Col>
        <Col xs='12'>
          <div className="webviewer" ref={viewer} style={{ height: "100vh" }}></div>
        </Col>
      </Row>
    </Container>
  );
};

export default Viewer;
