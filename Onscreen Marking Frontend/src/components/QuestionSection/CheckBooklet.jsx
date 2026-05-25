import React, { useEffect, useState } from "react";
import axios from "axios";

import CustomAddButton from "UI/CustomAddButton";
import IconButton from "@mui/material/IconButton";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { getQuestionSchemaById } from "components/Helper/Evaluator/EvalRoute";
import { postMarkById } from "components/Helper/Evaluator/EvalRoute";
import { useDispatch, useSelector } from "react-redux";
import { FiX } from "react-icons/fi";
import { IoPaperPlaneOutline } from "react-icons/io5";
// import socket from "../../services/socket/socket";
import { io } from "socket.io-client";
import {
  setCurrentIcon,
  setIsDraggingIcon,
  setCurrentQuestion,
  setCurrentMarkDetails,
  setCurrentTaskDetails,
  setCurrentQuestionDefinitionId,
  setIsLoadingTrue,
  setIsLoadingFalse,
  setCurrentSubQuestionParentId,
} from "store/evaluatorSlice";
import socket from "../../services/socket/socket";
import { changeCurrentIndexById } from "components/Helper/Evaluator/EvalRoute";
import { setCurrentBookletIndex } from "store/evaluatorSlice";
import { generateNumbers } from "services/Evaluator/generateNumber";
import { submitTaskByType } from "components/Helper/Evaluator/EvalRoute";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import captureScreenAndPhoto from "views/Screenshot/index";
function sortByQuestionsName(arr) {
  return arr.sort((a, b) => {
    return Number(a.questionsName) - Number(b.questionsName);
  });
}

const CheckBooklet = (props) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [allQuestions, setAllQuestions] = useState([]);
  const [rotationStates, setRotationStates] = useState({});
  const [marked, setMarked] = useState(false);
  const [totalMarks, setTotalMarks] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const { pageQualityData, setPageQualityData } = props;
  const [otherReason, setOtherReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [markPlaced, setMarkPlaced] = useState(false);
  const [showRemark, setShowRemark] = useState(false);

  const evaluatorState = useSelector((state) => state.evaluator);
  const currentIndex = evaluatorState.currentIndex;
  const taskDetails = evaluatorState.currentTaskDetails;
  const currentBookletIndex = evaluatorState.currentBookletIndex;
  const currentQuestion = evaluatorState.currentQuestion;
  const currentAnswerPdfImageId = evaluatorState.currentAnswerPdfImageId;
  const currentBookletId = evaluatorState.currentBookletId;
  const currentParentId = evaluatorState.currentSubQuestionParentId;
  const currentTaskDetails = evaluatorState.currentTaskDetails;
  const marksStore = useSelector((state) => state.annotation.marksStore);
  const annotationStore = useSelector(
    (state) => state.annotation.annotationStore
  );
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const {socket} = props
  console.log(annotationStore);

  const sortByQuestionNumber = (a, b) => {
    const aParts = a.questionsName.split(".").map(Number);
    const bParts = b.questionsName.split(".").map(Number);

    const len = Math.max(aParts.length, bParts.length);

    for (let i = 0; i < len; i++) {
      const diff = (aParts[i] || 0) - (bParts[i] || 0);
      if (diff !== 0) return diff;
    }

    return 0;
  };

  const sortedMarksData = [...(props.confirmationData?.marksData || [])].sort(
    sortByQuestionNumber
  );

  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  useEffect(() => {
    console.log(props.confirmationData);
  }, [props.setsubmitModel, socket, props.submitModel]);

  const rejectionReasons = [
    "Incorrect booklet uploaded",
    "Pages missing or unreadable",
    "Booklet not related to assigned task",
    "Other",
  ];

  const currentQuestionDefinitionId = useSelector(
    (state) => state.evaluator.currentQuestionDefinitionId
  );

  //  console.log({
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });
  // useEffect(() => {
  //   if (allQuestions.length !== 0) {
  //     setCurrentQuestionDefinitionId(allQuestions[currentQuestion]._id);
  //   }
  //   console.log(allQuestions[currentQuestion]._id);
  // }, [allQuestions, currentQuestion]);
  // console.log(props.userTimerData);

  // const handleSubmitConfirm = () => {
  //   if (!props.allPagesVisited) {
  //     toast.warning("Please view all pages before submitting");
  //     return;
  //   }

  //   // ✅ NEW VALIDATION START
  //   if (remark && (remark.type === "increase" || remark.type === "decrease")) {
  //     const from = remark.range?.from;
  //     const to = remark.range?.to;

  //     // check valid range exists
  //     if (from == null || to == null) {
  //       toast.error("Invalid remark range");
  //       return;
  //     }

  //     // check if ANY question marks fall in range
  //     const isValid = allQuestions.some((q) => {
  //       return q.allottedMarks >= from && q.allottedMarks <= to;
  //     });

  //     if (!isValid) {
  //       toast.error(
  //         `Marks must be between ${from} and ${to} for ${remark.type} remark`
  //       );
  //       return;
  //     }
  //   }

  //   // ✅ ANNOTATION VALIDATION START

  //   // extract annotation types
  //   // const annotations = marksStore?.map((a) => a.type) || [];

  //   const annotations =
  //     annotationStore
  //       ?.filter(
  //         (a) => a.iconUrl === "/check1.png" || a.iconUrl === "/cross1.png"
  //       )
  //       .map((a) => a.iconUrl) || [];

  //   const hasCheck = annotations.includes("/check1.png");
  //   const hasCross = annotations.includes("/cross1.png");

  //   // total marks
  //   const totalObtained = allQuestions.reduce(
  //     (sum, q) => sum + (q.allottedMarks || 0),
  //     0
  //   );

  //   const totalMax = allQuestions.reduce(
  //     (sum, q) => sum + (q.maxMarks || 0),
  //     0
  //   );

  //   // ✅ Case 1 — FULL MARKS
  //   if (totalObtained === totalMax) {
  //     if (!hasCheck || hasCross) {
  //       toast.error("Full marks allowed only when all annotations are ✔");
  //       return;
  //     }
  //   }

  //   // ✅ Case 2 — ZERO MARKS
  //   if (totalObtained === 0) {
  //     if (!hasCross || hasCheck) {
  //       toast.error("Zero marks allowed only when all annotations are ❌");
  //       return;
  //     }
  //   }

  //   // ✅ Case 3 — PARTIAL MARKS
  //   if (totalObtained > 0 && totalObtained < totalMax) {
  //     if (!hasCheck || !hasCross) {
  //       toast.error(
  //         "Partial marks require at least one ✔ and one ❌ annotation"
  //       );
  //       return;
  //     }
  //   }

  //   console.log("annotationStore:", annotationStore);

  //   // ✅ ANNOTATION VALIDATION END
  //   // ✅ NEW VALIDATION END

  //   if (!socket) return;

  //   const taskId = props.id;
  //   const answerPdfId = props.answerPdfDetailsId._id;

  //   socket.emit("get-marks-data", {
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });

  //   props.setsubmitModel(true);
  // };

  // const handleSubmitConfirm = () => {
  //   // 🚫 BLOCK if all pages not visited
  //   if (!props.allPagesVisited) {
  //     toast.warning("Please view all pages before submitting");
  //     return;
  //   }

  //   if (!socket) return;

  //   const taskId = props.id;
  //   const answerPdfId = props.answerPdfDetailsId._id;

  //   socket.emit("get-marks-data", {
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });

  //   props.setsubmitModel(true);
  // };

  const handleSubmitConfirm = () => {
    // if (!props.allPagesVisited) {
    //   toast.warning("Please view all pages before submitting");
    //   return;
    // }

    const checkedPages = new Set(pageQualityData.map((p) => p.pageNumber));

    if (checkedPages.size !== props.totalPages) {
      toast.error("Please verify all pages quality");
      return;
    }

    props.setsubmitModel(true);
  };

  useEffect(() => {
    if (!socket) return;

    const handler = (data) => {
      props.setconfirmationData(data);
    };

    socket.on("updated-marks-data", handler);

    return () => socket.off("updated-marks-data", handler);
  }, [props.id, props.answerPdfDetailsId, socket]);

  // console.log(props.answerPdfDetailsId);

  // const handlereject = async () => {
  //   const obj = {
  //     assignments: [
  //       {
  //         questiondefinitionId: props.answerPdfDetailsId?.questiondefinitionId,
  //         subjectCode: taskDetails?.subjectCode,
  //         bookletsToAssign: [props.answerPdfDetailsId?._id],
  //       },
  //     ],
  //   };

  //   const response = await axios.post(
  //     `${process.env.REACT_APP_API_URL}/api/tasks/assign-head-evaluator`,
  //     obj,
  //     {
  //       headers: {
  //         Authorization: `Bearer ${token}`,
  //       },
  //     }
  //   );
  //   if (response.ok) {
  //     toast.success("Booklet Rejected");
  //   }
  // };

  const handlereject = async () => {
    try {
      dispatch(setIsLoadingTrue());

      const obj = {
        assignments: [
          {
            questiondefinitionId:
              props.answerPdfDetailsId?.questiondefinitionId,
            subjectCode: taskDetails?.subjectCode,
            bookletsToAssign: [props.answerPdfDetailsId?._id],
          },
        ],
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/assign-head-evaluator`,
        obj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Booklet Rejected");

        // ✅ SAME LOGIC AS SUBMIT & NEXT
        const isLastBooklet =
          Number(taskDetails.currentFileIndex) >=
          Number(taskDetails.totalBooklets);

        // ✅ If LAST → go to task page
        if (isLastBooklet) {
          navigate("/evaluator/assignedtasks");
          return;
        }

        // ✅ Otherwise → go to next booklet
        const taskId = taskDetails._id;
        const nextIndex = Number(taskDetails.currentFileIndex) + 1;

        const res = await changeCurrentIndexById(taskId, nextIndex);

        dispatch(setCurrentBookletIndex(res));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject booklet");
    } finally {
      dispatch(setIsLoadingFalse());
    }
  };

  const handleuncleanBooklet = async () => {
    try {
      dispatch(setIsLoadingTrue());

      const obj = {
        questiondefinitionId: props.answerPdfDetailsId?.questiondefinitionId,
        subjectCode: taskDetails?.subjectCode,
        bookletsToAssign: [props.answerPdfDetailsId?._id],
      };

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/reject-booklet`,
        obj,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        toast.success("Booklet Rejected");

        // ✅ SAME LOGIC AS SUBMIT & NEXT
        const isLastBooklet =
          Number(taskDetails.currentFileIndex) >=
          Number(taskDetails.totalBooklets);

        // ✅ If LAST → go to task page
        if (isLastBooklet) {
          navigate("/evaluator/assignedtasks");
          return;
        }

        // ✅ Otherwise → go to next booklet
        const taskId = taskDetails._id;
        const nextIndex = Number(taskDetails.currentFileIndex) + 1;

        const res = await changeCurrentIndexById(taskId, nextIndex);

        dispatch(setCurrentBookletIndex(res));
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to reject booklet");
    } finally {
      dispatch(setIsLoadingFalse());
    }
  };

  useEffect(() => {
    const fetchQuestionDetails = async (answerPdfDetails, userId) => {
      console.log(answerPdfDetails);
      try {
        socket.emit("get-questions", {
          taskId:
            props.schemaDetails?.schemaType === "booklet_wise"
              ? answerPdfDetails.bookletTaskId
              : answerPdfDetails.taskId,
          answerPdfId: answerPdfDetails._id,
          userId: userId,
        });

        // const response2 = await getQuestionSchemaById(
        //   answerPdfDetails.taskId,
        //   answerPdfDetails._id
        // );
        // console.log(response2);
        // const reducedArr = response2.reduce((total, item) => {
        //   return total + item.allottedMarks;
        // }, 0);
        // setTotalMarks(reducedArr);
        // console.log(reducedArr);
        // dispatch(
        //   setCurrentQuestionDefinitionId(response2[currentQuestion - 1]._id)
        // );

        // setAllQuestions(sortByQuestionsName(response2));
      } catch (error) {
        console.log(error);
      }
    };

    if (props.answerPdfDetails) {
      fetchQuestionDetails(
        props.answerPdfDetails,
        props.taskdetails?.userId,
        props.taskdetails.questiondefinitionId
      );
    }

    {
      console.log("📄 Child answerPdfDetails:", props.answerPdfDetails);
    }
  }, [props.answerPdfDetails, marked, evaluatorState.rerender]);

  socket.on("questions-data", (data) => {
    // console.log(data);
    setAllQuestions(sortByQuestionsName(data.marks));
    const reducedArr = data.marks
      .filter((item) => item.isSubQuestion === false)
      .reduce((total, item) => total + item.allottedMarks, 0);
    const total = data.marks
      .filter((item) => item.isSubQuestion === false)
      .reduce((total, item) => total + item.maxMarks, 0);
    setTotalMarks(reducedArr);
    props.settotalMarksToDisplay(reducedArr);
    props.setTotalMarks(total);
    const qID = data.marks.find(
      (id) => parseFloat(id.questionsName) === currentQuestion
    );

    if (!qID || !qID._id) {
      console.warn("qID not found for currentQuestion:", currentQuestion);
      return;
    }

    dispatch(setCurrentQuestionDefinitionId(qID._id));
  });

  console.log(allQuestions);
  const handleRejectSubmit = async () => {
    if (!selectedReason) {
      toast.warning("Please select a rejection reason");
      return;
    }

    if (selectedReason === "Other" && !otherReason.trim()) {
      toast.warning("Please enter rejection reason");
      return;
    }

    const token = localStorage.getItem("token");

    const payload = {
      answerPdfId: currentBookletId,
      taskId: taskDetails._id,
      userId: props.taskdetails?.userId,
      reason: selectedReason === "Other" ? otherReason.trim() : selectedReason,
      rejectedAt: new Date().toISOString(),
    };

    try {
      setRejectLoading(true);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/rejectbooklet/${currentBookletId}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      toast.success(res.data?.message || "Booklet rejected successfully");

      setShowRejectModal(false);
      setSelectedReason("");
      setOtherReason("");
      navigate("/evaluator/assignedtasks");
    } catch (error) {
      console.error("Reject booklet failed", error);
      toast.error(error?.response?.data?.message || "Failed to reject booklet");
    } finally {
      setRejectLoading(false);
    }
  };

  const handleRotate = (index) => {
    setRotationStates({
      [index]: rotationStates[index] === 45 ? 0 : 45, // Toggle only the current index
    });
  };

  const handleListClick = async (item, mark, index) => {
    const { _id, answerPdfId, allottedMarks, maxMarks } = item;

    const remainingMarks = maxMarks - allottedMarks;

    if (mark > remainingMarks) {
      toast.warning("You cannot assign more than remaining marks");
      return;
    }

    const safeMark = Math.min(mark, remainingMarks);
    const totalAllocatedMarks = allottedMarks + safeMark;

    // ✅ MOVE BODY OUTSIDE TRY
    const body = {
      questionDefinitionId: _id,
      answerPdfId: answerPdfId,
      allottedMarks: +mark,
      totalAllocatedMarks: totalAllocatedMarks,
      timerStamps: new Date().toLocaleString(),
    };

    try {
      dispatch(setCurrentQuestionDefinitionId(_id));
      dispatch(setCurrentMarkDetails(body));
      dispatch(setCurrentIcon("/check1.png"));
      dispatch(setIsDraggingIcon(true));
      dispatch(setCurrentQuestion(parseFloat(item.questionsName)));

      setMarked((prev) => !prev);
      setRotationStates({
        [index]: (rotationStates[index] = 0),
      });
    } catch (error) {}

    // ✅ SAFE NOW
    dispatch(setCurrentMarkDetails(body));

    // 🔥 IMPORTANT
    setMarkPlaced(false);
  };

  const remark = props.answerPdfDetails?.remark;
  // console.log(allQuestions);

  // console.log(evaluatorState.isLoading);
  const handleNextBooklet = async () => {
    try {
      dispatch(setIsLoadingTrue());

      await captureScreenAndPhoto(window.webcamRef);

      // ✅ Step 1: Submit current booklet first
      const submitted = await submitCurrentBooklet();
      if (!submitted) return;

      const isLastBooklet =
        Number(taskDetails.currentFileIndex) >=
        Number(taskDetails.totalBooklets);

      // ✅ Step 2: If LAST booklet → just finish
      if (isLastBooklet) {
        navigate("/evaluator/assignedtasks");
        return;
      }

      // ✅ Step 3: Otherwise move to next booklet
      const taskId = taskDetails._id;
      const nextIndex = Number(taskDetails.currentFileIndex) + 1;

      const response = await changeCurrentIndexById(taskId, nextIndex);
      // console.log(response);
      dispatch(setCurrentBookletIndex(response));
      window.location.reload();
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    } finally {
      dispatch(setIsLoadingFalse());
      props.setsubmitModel(false);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      const tag = document.activeElement.tagName.toLowerCase();
      if (tag === "input" || tag === "textarea") return;

      if (e.ctrlKey && e.key.toLowerCase() === "s") {
        e.preventDefault(); // Stop browser save
        handleSubmitConfirm(); // ✅ Open confirmation modal ONLY
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleSubmitConfirm]);

  // console.log(evaluatorState.isLoading);
  const handlePrevBooklet = async () => {
    try {
      if (currentBookletIndex > 1) {
        setIsLoadingTrue();
        const taskId = taskDetails._id;
        const response = await changeCurrentIndexById(
          taskId,
          currentBookletIndex - 1
        );
        dispatch(setCurrentBookletIndex(currentBookletIndex - 1));
        // console.log(response);
      }
      // console.log(taskDetails);
      //
    } catch (error) {
      console.log(error);
    } finally {
      setIsLoadingFalse();
    }
  };

  const submitCurrentBooklet = async () => {
    try {
      const remainingMinutes = Math.floor(props.remainingSecondsRef / 60);
      const timeTaken = props.userTimerData.totalTime - remainingMinutes;

      const res = await submitTaskByType(
        currentBookletId,
        taskDetails._id,
        pageQualityData,
        timeTaken
      );

      if (!res) {
        toast.error("No response from server");
        return false;
      }

      if (!res.success) {
        toast.warning(res.message || "Submission failed");
        navigate("/evaluator/assignedtasks");
        return false;
      }

      toast.success(res.message);
      return true; // ✅ tell caller submit worked
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit booklet");
      return false;
    }
  };

  const submitHandler = async () => {
    try {
      // remainingSecondsRef = seconds left
      const remainingMinutes = Math.floor(props.remainingSecondsRef / 60);

      // totalTime = total allowed time (minutes)
      const timeTaken = props.userTimerData.totalTime - remainingMinutes;

      const res = await submitTaskByType(
        currentBookletId,
        // props.taskdetails.userId,
        taskDetails._id,
        timeTaken // ✅ THIS IS 18 (example)
      );

      if (res.success) {
        toast.success(res.message);
        navigate("/evaluator/assignedtasks");
      } else {
        toast.warning(res.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to submit booklet");
    }
  };
  return (
    <div className="h-[90%] ">
      {/* <div className="flex  h-[7%] w-[100%]">
        <button
          type="button"
          className="mb-2  w-[50%] bg-[#33597a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#26445e] focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          onClick={handlePrevBooklet}
        >
          {"<"} Prev Booklet
        </button>
        <button
          type="button"
          className="mb-2  w-[100%] bg-[#33597a] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#26445e] focus:outline-none focus:ring-4 focus:ring-green-300 dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800"
          onClick={handleNextBooklet}
        >
          Next Booklet {">"}
        </button>
      </div> */}

      <div className="relative h-[100%] overflow-hidden shadow-md sm:rounded-lg">
        {/* Scrollable content */}
        <div className="scrollbar-hide h-[calc(100%-4rem)] overflow-y-auto">
          {" "}
          {/* Adjust height as needed */}
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3 text-[12px]">
                  Page
                </th>
                <th scope="col" className="px-6 py-3 text-[12px]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <div className="flex flex-col items-center gap-3 px-2 py-3">
                    <tbody>
                      {pageQualityData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={2}
                            className="py-3 text-center text-gray-500"
                          >
                            No page checked yet
                          </td>
                        </tr>
                      ) : (
                        <div className="space-y-3">
                          {[...pageQualityData]
                            .sort((a, b) => a.pageNumber - b.pageNumber)
                            .map((page, index) => (
                              <div
                                key={page.pageId}
                                className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
                              >
                                {/* LEFT SECTION */}
                                <div className="flex items-center gap-4">
                                  {/* PAGE NUMBER */}
                                  <div className="flex h-11 w-11 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-indigo-600">
                                    {index + 1}
                                  </div>

                                  {/* TEXT */}
                                  <div className="flex flex-col">
                                    <span className="text-sm font-semibold text-gray-800">
                                      Page {page.pageNumber}
                                    </span>

                                    <span className="text-xs text-gray-500">
                                      Quality Verification
                                    </span>
                                  </div>
                                </div>

                                {/* STATUS BADGE */}
                                <div
                                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                                    page.status === "ok"
                                      ? "bg-green-100 text-green-700"
                                      : "bg-red-100 text-red-700"
                                  }`}
                                >
                                  <span className="flex items-center text-base">
                                    {page.status === "ok" ? "✔" : "✖"}
                                  </span>

                                  <span>
                                    {page.status === "ok" ? "Pass" : "Fail"}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </tbody>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        {/* Footer always visible */}
        <div className="bg-white px-2 py-3 dark:bg-gray-800">
          <div className="flex items-center justify-between rounded-lg border border-dashed border-blue-400 px-2 py-2">
            {/* LEFT */}
            <span className="text-[16px] font-semibold text-gray-800 dark:text-white">
              Total Pages Checked :
            </span>

            {/* RIGHT */}
            <div className="text-sm font-semibold">
              <span className="text-[12px] font-semibold">
                {pageQualityData.length}
              </span>
              {/* <span className="ml-1 text-sm text-gray-500">
                / {props.totalMarks}
              </span> */}
            </div>

            {remark && (
              <div className=" text-right">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowRemark(true);
                  }}
                  className="rounded bg-blue-500 px-2 text-white hover:bg-blue-600"
                >
                  View
                </button>
              </div>
            )}
          </div>

          {/* OPTIONAL BUTTON */}
        </div>
      </div>

      {remark && showRemark && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[420px] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold text-gray-800">
              Remark Details
            </h2>

            {/* ✅ Dynamic Content */}
            <div className="space-y-3 text-sm text-gray-700">
              {/* TYPE */}
              <p>
                <strong>Type:</strong> {remark.type}
              </p>

              {/* ✅ INCREASE / DECREASE */}
              {(remark.type === "increase" || remark.type === "decrease") && (
                <>
                  <p>
                    <strong>From:</strong> {remark.range?.from}
                  </p>
                  <p>
                    <strong>To:</strong> {remark.range?.to}
                  </p>
                </>
              )}

              {/* ✅ ANNOTATION */}
              {remark.type === "annotation" && (
                <>
                  <p>
                    <strong>Page Number:</strong> {remark.pageNumber}
                  </p>
                  <p>
                    <strong>Annotation Type:</strong> {remark.annotationType}
                  </p>
                </>
              )}

              {/* ✅ CUSTOM */}
              {remark.type === "custom" && (
                <p>
                  <strong>Remark:</strong>{" "}
                  {remark.comment || remark.customRemark}
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setShowRemark(false)}
                className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        className="
      mt-2 px-3 py-3"
      >
        {/* <button
          type="button"
          // disabled={
          //   props.remainingSecondsRef / 60 < props.userTimerData.minTime
          // }
          onClick={handlereject}
          className={`mb-1 w-full rounded-lg border px-5 py-3 text-sm font-semibold transition
      ${
        props.remainingSecondsRef / 60 < props.userTimerData.minTime
          ? "bg-transparent cursor-not-allowed border border-red-700 opacity-60 shadow-[inset_0_2px_6px_rgba(220,38,38,0.6)]"
          : "bg-transparent cursor-pointer shadow-[inset_0_1px_6px_rgba(220,38,38,0.6),inset_0_-1px_6px_rgba(220,38,38,0.6)] transition-all duration-300 ease-in-out hover:shadow-[inset_0_5px_6px_rgba(220,38,38,0.6),inset_0_-5px_6px_rgba(220,38,38,0.6)] focus:ring-4  focus:ring-red-300"
      }
  }
      text-red-700`}
        >
          REJECT BOOKLET
        </button> */}

        {remark && (
          <button
            type="button"
            onClick={handlereject}
            className={`mb-1 w-full rounded-lg border px-5 py-3 text-sm font-semibold transition
      ${
        props.remainingSecondsRef / 60 < props.userTimerData.minTime
          ? "bg-transparent cursor-not-allowed border border-red-700 opacity-60 shadow-[inset_0_2px_6px_rgba(220,38,38,0.6)]"
          : "bg-transparent cursor-pointer shadow-[inset_0_1px_6px_rgba(220,38,38,0.6),inset_0_-1px_6px_rgba(220,38,38,0.6)] transition-all duration-300 ease-in-out hover:shadow-[inset_0_5px_6px_rgba(220,38,38,0.6),inset_0_-5px_6px_rgba(220,38,38,0.6)] focus:ring-4 focus:ring-red-300"
      }
      text-red-700`}
          >
            Head Evaluator
          </button>
        )}
        {/* <button
          type="button"
          onClick={handleuncleanBooklet}
          className={`mb-2 w-full rounded-lg border px-5 py-3 text-sm font-semibold transition
      ${
        props.remainingSecondsRef / 60 < props.userTimerData.minTime
          ? "cursor-not-allowed border border-red-700 bg-red-800 opacity-60 shadow-[inset_0_2px_6px_rgba(220,38,38,0.6)]"
          : "cursor-pointer bg-red-800 shadow-[inset_0_1px_6px_rgba(220,38,38,0.6),inset_0_-1px_6px_rgba(220,38,38,0.6)] transition-all duration-300 ease-in-out hover:shadow-[inset_0_5px_6px_rgba(220,38,38,0.6),inset_0_-5px_6px_rgba(220,38,38,0.6)] focus:ring-4 focus:ring-red-300"
      }
      text-white`}
        >
          <FiX className="text-xl" />
          REJECT BOOKLET
        </button>
        <button
          type="button"
          disabled={
            props.remainingSecondsRef / 60 < props.userTimerData.minTime
          }
          onClick={handleSubmitConfirm}
          className={`w-full rounded-lg border px-5 py-3 text-sm font-semibold text-white transition
      ${
        props.remainingSecondsRef / 60 < props.userTimerData.minTime ||
        !props.allPagesVisited
          ? "cursor-not-allowed border-green-700 bg-green-700 opacity-60"
          : "cursor-pointer bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300"
      }`}
        >
          <IoPaperPlaneOutline className="text-xl" />
          SUBMIT BOOKLET AND NEXT
        </button> */}

        {/* REJECT BUTTON */}
        <button
          type="button"
          onClick={handleuncleanBooklet}
          className={`mb-2 flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold transition
  ${
    props.remainingSecondsRef / 60 < props.userTimerData.minTime
      ? "cursor-not-allowed border-red-700 bg-red-800 opacity-60"
      : "cursor-pointer bg-red-800 hover:bg-red-900 focus:ring-4 focus:ring-red-300"
  }
  text-white`}
        >
          <FiX className="text-[14px] font-bold" />
          REJECT BOOKLET
        </button>

        {/* SUBMIT BUTTON */}
        <button
          type="button"
          disabled={
            props.remainingSecondsRef / 60 < props.userTimerData.minTime
          }
          onClick={handleSubmitConfirm}
          className={`flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-2 text-[12px] font-semibold text-white transition
  ${
    props.remainingSecondsRef / 60 < props.userTimerData.minTime ||
    !props.allPagesVisited
      ? "cursor-not-allowed border-green-700 bg-green-700 opacity-60"
      : "cursor-pointer bg-green-600 hover:bg-green-700 focus:ring-4 focus:ring-green-300"
  }`}
        >
          <IoPaperPlaneOutline className="text-[14px] font-bold" />
          SUBMIT BOOKLET AND NEXT
        </button>
      </div>

      {props.submitModel && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[50%] rounded-lg bg-white p-6 shadow-lg">
            {/* ✅ PAGE QUALITY SUMMARY */}
            <div className="mt-4 w-full rounded-lg border border-gray-300 bg-white p-3">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Page Quality Summary
              </h3>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-3 py-2">Page</th>
                    <th className="border px-3 py-2 text-center">Status</th>
                  </tr>
                </thead>

                <tbody>
                  {pageQualityData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-3 text-center text-gray-500"
                      >
                        No page checked
                      </td>
                    </tr>
                  ) : (
                    [...pageQualityData]
                      .sort((a, b) => a.pageNumber - b.pageNumber)
                      .map((page) => (
                        <tr key={page.pageId}>
                          {/* PAGE */}
                          <td className="border px-3 py-2 font-medium text-gray-800">
                            Page {page.pageNumber}
                          </td>

                          {/* STATUS */}
                          <td
                            className={`border px-3 py-2 text-center font-semibold ${
                              page.status === "ok"
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {page.status === "ok" ? "✔ Pass" : "❌ Fail"}
                          </td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => props.setsubmitModel(false)}
                className="rounded-md border px-4 py-2 text-sm hover:bg-gray-100"
              >
                Cancel
              </button>

              <button
                className="rounded-md bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700 disabled:opacity-60"
                onClick={handleNextBooklet}
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(CheckBooklet);
