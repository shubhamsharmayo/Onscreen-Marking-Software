import React, { useEffect, forwardRef, useState } from "react";
import { v4 as uuidv4 } from "uuid";
import { Modal, Button, Row, Col, Spinner, Form } from "react-bootstrap";
import { toast } from "react-toastify";
import { select } from "@syncfusion/ej2-base";

const FormData = forwardRef(
  (
    {
      setCurrentBoxData,
      currentBoxData,
      setBoxes,
      activeBox,
      allBubbles,
      isNewBox,
      setIsOpen,
      setActiveBox,
      subName,
      // setRadius,
      Radius,
    },
    ref,
  ) => {
    const [customInput, setCustomInput] = useState("");
    console.log(currentBoxData);

    useEffect(() => {
      if (isNewBox) {
        setCurrentBoxData({});
      }
    }, [isNewBox]);

    useEffect(() => {
      if (Array.isArray(currentBoxData?.Custom)) {
        setCustomInput(currentBoxData.Custom.join(", "));
      }
    }, []);

    const QUESTION_NAME_REGEX = /^([qQ])(\d+)-([qQ])(\d+)$/;

    function parseQuestionRange(name) {
      if (!name || typeof name !== "string") return null;
      const m = name.trim().match(QUESTION_NAME_REGEX);
      if (!m) return null;

      const prefix = m[1];
      const start = Number(m[2]);
      const end = Number(m[4]);

      if (!Number.isFinite(start) || !Number.isFinite(end)) return null;
      if (end <= start) return null; // enforce increasing range

      return {
        prefix,
        start,
        end,
        gap: end - start + 1,
      };
    }

    console.log(subName);

    const onSubmitHandler = (e) => {
      e.preventDefault();

      if (!currentBoxData) {
        alert("Please fill all the fields");
        return;
      }

      const {
        totalRow,
        totalCol,
        fieldName,
        fieldType,
        ReadingDirection,
        allowMultiple,
        fieldValue,
        bubbleIntensity,
      } = currentBoxData;

      // Basic required fields validation
      if (
        !fieldName ||
        !fieldType ||
        !ReadingDirection ||
        !allowMultiple ||
        !bubbleIntensity
      ) {
        alert("Please complete all required fields.");
        return;
      }

      // Validate positive row/column
      if (Number(totalRow) <= 0 || Number(totalCol) <= 0) {
        alert("Row and Column values must be greater than 0.");
        return;
      }

      // ---------------------------
      // QUESTION FIELD VALIDATION
      // ---------------------------
      if (fieldType === "questionfield") {
        const parsed = parseQuestionRange(fieldName);

        if (!parsed) {
          toast.error(
            "Invalid question field name. Use format q1-q10 or Q1-Q10.",
          );
          return;
        }
      }

      // ---------------------------
      // CREATE NEW BOX
      // ---------------------------
      if (isNewBox) {
        setBoxes((prevBoxes) => [
          ...prevBoxes,
          {
            id: uuidv4(),
            ...currentBoxData,
            x: 100,
            y: 100,
            width: 150,
            height: 100,
            radius: currentBoxData?.radius,
            isMerged: false,
            merge: false,
          },
        ]);

        setCurrentBoxData({});
        setIsOpen(false);
        return;
      }

      // ---------------------------
      // UPDATE EXISTING BOX
      // ---------------------------
      setBoxes((prevBoxes) =>
        prevBoxes.map((box, idx) =>
          idx === activeBox
            ? {
                ...currentBoxData,
                fieldName: currentBoxData.fieldName?.trim(),
              }
            : box,
        ),
      );

      setActiveBox(null);
    };

    const [shakeField, setShakeField] = useState({});

    const handleKeyDown = (e, fieldName) => {
      const allowedKeys = [
        "Backspace",
        "Delete",
        "ArrowLeft",
        "ArrowRight",
        "Arrowtop",
        "ArrowBottom",
        "Tab",
      ];

      if (!/^[0-9]$/.test(e.key) && !allowedKeys.includes(e.key)) {
        e.preventDefault();

        setShakeField((prev) => ({
          ...prev,
          [fieldName]: true,
        }));

        setTimeout(() => {
          setShakeField((prev) => ({
            ...prev,
            [fieldName]: false,
          }));
        }, 300);
      }
    };

    return (
      <Form
        onSubmit={onSubmitHandler}
        className="p--2 bg-white rounded shadow-sm "
      >
        <h2 className="text-center mb-1">Box Settings</h2>

        {currentBoxData?.fieldType !== "barcode" && (
          <Row>
            <Col md={6}>
              <Form.Group controlId="totalCol">
                <Form.Label>Row:</Form.Label>
                <Form.Control
                  type="number"
                  value={currentBoxData?.totalRow}
                  className={shakeField.totalRow ? "shake" : ""}
                  onKeyDown={(e) => handleKeyDown(e, "totalRow")}
                  onChange={(e) =>
                    setCurrentBoxData((prev) => ({
                      ...prev,
                      totalRow: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group controlId="totalRow">
                <Form.Label>Col:</Form.Label>
                <Form.Control
                  type="number"
                  value={currentBoxData?.totalCol}
                  className={shakeField.totalCol ? "shake" : ""}
                  onKeyDown={(e) => handleKeyDown(e, "totalCol")}
                  onChange={(e) =>
                    setCurrentBoxData((prev) => ({
                      ...prev,
                      totalCol: e.target.value,
                    }))
                  }
                />
              </Form.Group>
            </Col>
          </Row>
        )}

        <style jsx>
          {`
            @keyframes shake {
              0% {
                transform: translateX(0);
              }
              20% {
                transform: translateX(-6px);
              }
              40% {
                transform: translateX(6px);
              }
              60% {
                transform: translateX(-4px);
              }
              80% {
                transform: translateX(4px);
              }
              100% {
                transform: translateX(0);
              }
            }

            .shake {
              border: 2px solid red !important;
               box-shadow: 0 0 5px red !important; 
              animation: shake 0.3s ease;
            }
          `}
        </style>

        <Row className="mt-2">
          <Col md={6}>
            <Form.Group controlId="fieldName">
              <Form.Label>Field Name:</Form.Label>
              <Form.Control
                type="text"
                value={currentBoxData?.fieldName}
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    fieldName: e.target.value,
                  }))
                }
              />
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="fieldType">
              <Form.Label>Field Type:</Form.Label>
              <Form.Control
                as="select"
                value={currentBoxData?.fieldType}
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    fieldType: e.target.value,
                  }))
                }
              >
                <option value="">Select direction</option>
                <option value="formfield">Form Field</option>
                <option value="questionfield">Question Field</option>
                <option value="barcode">Barcode</option>
                <option value="lithocode">lithocode</option>
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-2">
          <Col md={6}>
            <Form.Group controlId="readingDirection">
              <Form.Label>Reading Direction:</Form.Label>
              <Form.Control
                as="select"
                value={currentBoxData?.ReadingDirection ?? ""}
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    ReadingDirection: e.target.value,
                  }))
                }
              >
                <option value="">Select direction</option>
                <option value="Row">Row</option>
                <option value="Column">Column</option>
              </Form.Control>
            </Form.Group>
          </Col>

          <Col md={6}>
            <Form.Group controlId="allowMultiple">
              <Form.Label>Allow Multiple:</Form.Label>
              <Form.Control
                as="select"
                value={currentBoxData?.allowMultiple ?? ""}
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    allowMultiple: e.target.value,
                  }))
                }
              >
                <option value="">Select multiple</option>
                <option value="true">Yes</option>
                <option value="false">No</option>
              </Form.Control>
            </Form.Group>
          </Col>
        </Row>

        <Row className="mt-2">
          {currentBoxData?.allowMultiple === "false" && (
            <Col md={6}>
              <Form.Group controlId="allowMultiple">
                <Form.Label>Multiple Value:</Form.Label>
                <Form.Control
                  as="input"
                  maxLength={1}
                  placeholder="Enter multiple value"
                  value={currentBoxData?.multipleBubbleOutput ?? ""}
                  onChange={(e) =>
                    setCurrentBoxData((prev) => ({
                      ...prev,
                      multipleBubbleOutput: e.target.value,
                    }))
                  }
                ></Form.Control>
              </Form.Group>
            </Col>
          )}
          <Col md={currentBoxData?.allowMultiple === "false" ? 6 : 12}>
            <Form.Group controlId="allowMultiple">
              <Form.Label>Blank Value:</Form.Label>
              <Form.Control
                as="input"
                maxLength={1}
                value={currentBoxData?.blankOuputSymbol ?? ""}
                placeholder="Enter blank value"
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    blankOuputSymbol: e.target.value,
                  }))
                }
              ></Form.Control>
            </Form.Group>
          </Col>
        </Row>

        {/* {currentBoxData?.fieldType !== "barcode" && (
          <Row className="mt-2">
            <Col md={12}>
              <Form.Group controlId="readingDirection">
                <Form.Label>Field Value:</Form.Label>
                <Form.Control
                  as="select"
                  value={currentBoxData?.fieldValue ?? ""}
                  onChange={(e) => {
                    if (e.target.value !== "Custom") {
                      setCurrentBoxData((prev) => {
                        const copiedData = { ...prev };
                        delete copiedData.Custom; // remove Custom property
                        return copiedData;
                      });
                    }
                    setCurrentBoxData((prev) => ({
                      ...prev,
                      fieldValue: e.target.value,
                    }));
                  }}
                >
                  <option value="">Select field value</option>
                  <option value="Integer">Integer</option>
                  <option value="Alphabet">Alphabet</option>
                  <option value="Custom">Custom</option>
                </Form.Control>
              </Form.Group>
            </Col>

            {currentBoxData?.merge === true && (
              <Col md={6}>
                <Form.Group controlId="mergeSubName">
                  <Form.Label>Sub Name</Form.Label>
                  <Form.Control
                    type="text"
                    value={currentBoxData?.subName ?? ""}
                    onChange={(e) =>
                      setCurrentBoxData((prev) => ({
                        ...prev,
                        subName: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        )} */}

        {currentBoxData?.fieldType !== "barcode" && (
          <Row className="mt-2">
            {/* First Input: Field Value */}
            <Col md={currentBoxData?.merge ? 6 : 12}>
              <Form.Group controlId="readingDirection">
                <Form.Label>Field Value:</Form.Label>
                <Form.Control
                  as="select"
                  value={currentBoxData?.fieldValue ?? ""}
                  onChange={(e) => {
                    const value = e.target.value;
                    setCurrentBoxData((prev) => {
                      const updatedData = { ...prev, fieldValue: value };
                      if (value !== "Custom") {
                        delete updatedData.Custom; // Remove Custom property if not selected
                      }
                      return updatedData;
                    });
                  }}
                >
                  <option value="">Select field value</option>
                  <option value="Integer">Integer</option>
                  <option value="Alphabet">Alphabet</option>
                  <option value="Custom">Custom</option>
                </Form.Control>
              </Form.Group>
            </Col>

            {/* Second Input: Sub Name */}
            {currentBoxData?.merge && (
              <Col md={currentBoxData?.merge ? 6 : 12}>
                <Form.Group controlId="mergeSubName">
                  <Form.Label>Sub Name</Form.Label>
                  <Form.Control
                    placeholder="Sub Name"
                    type="text"
                    value={currentBoxData?.subName ?? ""}
                    onChange={(e) =>
                      setCurrentBoxData((prev) => ({
                        ...prev,
                        subName: e.target.value,
                      }))
                    }
                  />
                </Form.Group>
              </Col>
            )}
          </Row>
        )}

        {/* Add one more box for extra input */}
        {currentBoxData?.fieldValue === "Custom" && (
          <Row className="mt-2">
            <Col md={12}>
              <Form.Group controlId="readingDirection">
                <Form.Label>Custom Value:</Form.Label>
                <Form.Control
                  as="input"
                  value={customInput}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    setCustomInput(inputValue); // allow free typing

                    const parsedArray = inputValue
                      .split(",")
                      .map((item) => item.trim())
                      .filter((item) => item.length > 0);

                    setCurrentBoxData((prev) => ({
                      ...prev,
                      Custom: parsedArray,
                    }));
                  }}
                ></Form.Control>
              </Form.Group>
            </Col>
          </Row>
        )}

        <Row className="mt-2">
          {/* <Col md={6}>
            <Form.Group controlId='margin'>
              <Form.Label>
                Margin: <strong>{currentBoxData?.gap}</strong>
              </Form.Label>
              <Form.Control
                type='range'
                min={0}
                max={80}
                step={0.1}
                value={currentBoxData?.gap}
                onChange={(e) => {
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    gap: e.target.value,
                  }));
                  setBoxes((prevBoxes) =>
                    prevBoxes.map((box, idx) =>
                      idx === activeBox ? { ...box, gap: e.target.value } : box
                    )
                  );
                }}
              />
            </Form.Group>
          </Col> */}

          <Col md={6}>
            <Form.Group controlId="intensity">
              <Form.Label>
                Intensity: <strong>{currentBoxData?.bubbleIntensity ?? 14.5}</strong>
              </Form.Label>
              <Form.Control
                className="bubble-range"
                type="range"
                min={-1}
                max={30}
                step={0.1}
                value={currentBoxData?.bubbleIntensity}
                onChange={(e) =>
                  setCurrentBoxData((prev) => ({
                    ...prev,
                    bubbleIntensity: Number(e.target.value),
                  }))
                }
              />
            </Form.Group>
          </Col>

          {currentBoxData?.fieldType !== "barcode" && (
            <Col md={6}>
              <Form.Group controlId="radius">
                <Form.Label>
                  Bubble Size:
                  <strong>{currentBoxData?.radius ?? 0.355}</strong>
                </Form.Label>

                <Form.Control
                  className="bubble-range"
                  type="range"
                  min={0.01}
                  max={0.7}
                  step={0.001}
                  value={currentBoxData?.radius}
                  onChange={(e) => {
                    // setRadius(Number(e.target.value));
                    const val = Number(e.target.value);
                    setCurrentBoxData((p) => ({ ...p, radius: val }));
                    setBoxes((prev) =>
                      prev.map((b, i) =>
                        i === activeBox ? { ...b, radius: val } : b,
                      ),
                    );
                  }}
                />
              </Form.Group>

              <style jsx>
                {`
                  .bubble-range {
                    accent-color: #0984e3;
                  }
                `}
              </style>
            </Col>
          )}
        </Row>

        <Row>
          <Col md={6}>
            <Form.Group controlId="best_bubble">
              <Form.Label>
                Best Bubble : <strong>{currentBoxData?.best_bubble}</strong>
              </Form.Label>

              <div
                className={`btn btn-sm  d-flex align-items-center justify-content-between ${
                  currentBoxData?.best_bubble
                    ? "btn-success"
                    : "btn-outline-secondary"
                }`}
                onClick={() => {
                  const newValue = !currentBoxData?.best_bubble;
                  setCurrentBoxData((p) => ({ ...p, best_bubble: newValue }));
                  setBoxes((prev) =>
                    prev.map((b, i) =>
                      i === activeBox ? { ...b, best_bubble: newValue } : b,
                    ),
                  );
                  console.log(currentBoxData?.best_bubble)
                }}
                style={{
                  cursor: "pointer",
                  position: "relative",
                  transition: "all 0.3s ease",
                  borderRadius: "60px",
                  width: "80px",
                  boxShadow: "0px 0px 4px gray",
                  backgroundColor: currentBoxData?.best_bubble
                    ? "##2dce89"
                    : "#e3e3e3",
                }}
              >
                <span
                  className={
                    currentBoxData?.best_bubble ? "fw-bold" : "text-muted"
                  }
                >
                  OFF
                </span>

                <div
                  className="bg-white rounded-circle shadow-sm"
                  style={{
                    width: "28px",
                    height: "26px",
                    position: "absolute",
                    left: currentBoxData?.best_bubble
                      ? "calc(100% - 29px)"
                      : "2px",
                    transition: "left 0.3s ease",
                    boxShadow: "2px 2px 4px black",
                  }}
                />

                <span
                  className={
                    currentBoxData?.best_bubble ? "fw-bold" : "text-muted"
                  }
                >
                  ON
                </span>
              </div>
            </Form.Group>
          </Col>
          <Col md={6}>
            <Form.Group controlId="merge">
              <Form.Label>
                Link : <strong>{currentBoxData?.merge ? "" : ""}</strong>
              </Form.Label>

              <div
                className={`btn btn-sm d-flex align-items-center justify-content-between ${
                  currentBoxData?.merge
                    ? "btn-warning"
                    : "btn-outline-secondary"
                }`}
                onClick={() => {
                  const newValue = !currentBoxData?.merge;

                  setCurrentBoxData((p) => ({ ...p, merge: newValue }));

                  setBoxes((prev) =>
                    prev.map((b, i) =>
                      i === activeBox ? { ...b, merge: newValue } : b,
                    ),
                  );
                }}
                style={{
                  cursor: "pointer",
                  borderRadius: "60px",
                  width: "70px",
                  boxShadow: "0px 0px 4px gray",
                }}
              >
                <span
                  className={currentBoxData?.merge ? "fw-bold" : "text-muted"}
                >
                  OFF
                </span>

                <div
                  className="bg-white rounded-circle shadow-sm"
                  style={{
                    width: "28px",
                    height: "26px",
                    position: "absolute",
                    left: currentBoxData?.merge ? "calc(100% - 29px)" : "2px",
                    transition: "left 0.3s ease",
                  }}
                />

                <span
                  className={currentBoxData?.merge ? "fw-bold" : "text-muted"}
                >
                  ON
                </span>
              </div>
            </Form.Group>
          </Col>
        </Row>

        <div className="text-right mt-1">
          <Button
            style={{ display: isNewBox ? "none" : "" }}
            ref={ref}
            type="submit"
            variant="primary"
          >
            Save
          </Button>
        </div>
      </Form>
    );
  },
);

export default FormData;
