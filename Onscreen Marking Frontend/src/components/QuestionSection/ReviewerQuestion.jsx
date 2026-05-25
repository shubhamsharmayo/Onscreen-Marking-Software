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
import { getAllReviewerTasks } from "components/Helper/Reviewer/ReviewerRoute";
import { changeCurrentIndexById } from "components/Helper/Evaluator/EvalRoute";
import { setCurrentBookletIndex } from "store/evaluatorSlice";
import { generateNumbers } from "services/Evaluator/generateNumber";
import { submitTaskByTyper } from "components/Helper/Reviewer/ReviewerRoute";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { getAllUsers } from "../../services/common";
function sortByQuestionsName(arr) {
  return arr.sort((a, b) => {
    return Number(a.questionsName) - Number(b.questionsName);
  });
}

const ReviewerQuestion = (props) => {
  const [selectedQuestion, setSelectedQuestion] = useState(0);
  const [allQuestions, setAllQuestions] = useState([]);
  const [rotationStates, setRotationStates] = useState({});
  const [marked, setMarked] = useState(false);
  const [totalMarks, setTotalMarks] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [rejectLoading, setRejectLoading] = useState(false);
  const [showRollbackModel, setshowRollbackModel] = useState(false);
  const [selectedUser, setSelectedUser] = useState("");

  const evaluatorState = useSelector((state) => state.evaluator);
  const taskDetails = evaluatorState.currentTaskDetails;
  const [userData, setuserData] = useState([]);
  const currentBookletIndex = evaluatorState.currentBookletIndex;
  const currentQuestion = evaluatorState.currentQuestion;
  const currentAnswerPdfImageId = evaluatorState.currentAnswerPdfImageId;
  const currentBookletId = evaluatorState.currentBookletId;
  const currentParentId = evaluatorState.currentSubQuestionParentId;
  const currentTaskDetails = evaluatorState.currentTaskDetails;
  const marksStore = useSelector((state) => state.annotation.marksStore);
  const [remarkType, setRemarkType] = useState("");
  const [range, setRange] = useState({ from: "", to: "" });
  const [pageNumber, setPageNumber] = useState("");
  const [customRemark, setCustomRemark] = useState("");
  const [annotationType, setAnnotationType] = useState("");
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // const {socket} = props
  // console.log(currentBookletId);
  // console.log(taskDetails);

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

  const goToNextBookletOrFinish = async () => {
    try {
      const currentIndex = Number(taskDetails.currentFileIndex);
      const total = Number(taskDetails.totalBooklets);

      const isLastBooklet = currentIndex === total;

      // ✅ If last booklet → task complete
      if (isLastBooklet) {
        toast.success("All booklets processed. Task completed.");
        navigate("/reviewer/assignedtasks");
        return;
      }

      // ✅ Otherwise move to next booklet
      const nextIndex = Number(taskDetails.currentFileIndex);
      await handleIndexChange(taskDetails._id, nextIndex);
      // const response = await changeCurrentIndexById(taskDetails._id, nextIndex);

      dispatch(setCurrentBookletIndex(nextIndex));
      toast.success("Moved to next booklet");
    } catch (error) {
      console.error(error);
      toast.error("Failed to load next booklet");
    }
  };

  const handleSubmitConfirm = () => {
    if (!socket) return;

    const taskId = props.id;
    const answerPdfId = props.answerPdfDetailsId._id;
    console.log("New Error Finded", answerPdfId);

    socket.emit("get-marks-data", {
      taskId,
      answerPdfId,
      userId: currentTaskDetails?.userId,
    });

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

  console.log(props.confirmationData);

  // useEffect(() => {
  //   const fetchQuestionDetails = async (answerPdfDetails, userId) => {
  //     try {
  //       socket.emit("get-questions", {
  //         taskId:
  //           props.schemaDetails?.schemaType === "booklet_wise"
  //             ? answerPdfDetails.bookletTaskId
  //             : answerPdfDetails.taskId,
  //         answerPdfId: answerPdfDetails._id,
  //         userId: userId,
  //       });

  //       // const response2 = await getQuestionSchemaById(
  //       //   answerPdfDetails.taskId,
  //       //   answerPdfDetails._id
  //       // );
  //       // console.log(response2);
  //       // const reducedArr = response2.reduce((total, item) => {
  //       //   return total + item.allottedMarks;
  //       // }, 0);
  //       // setTotalMarks(reducedArr);
  //       // console.log(reducedArr);
  //       // dispatch(
  //       //   setCurrentQuestionDefinitionId(response2[currentQuestion - 1]._id)
  //       // );

  //       // setAllQuestions(sortByQuestionsName(response2));
  //     } catch (error) {
  //       console.log(error);
  //     }
  //   };

  //   if (props.answerPdfDetails) {
  //     fetchQuestionDetails(
  //       props.answerPdfDetails,
  //       props.taskdetails.userId,
  //       props.taskdetails.questiondefinitionId
  //     );
  //   }
  // }, [props.answerPdfDetails, marked, evaluatorState.rerender]);

  useEffect(() => {
    if (currentBookletId && taskDetails) {
      console.log("🔥 FETCHING QUESTIONS FOR:", currentBookletId);

      socket.emit("get-questions", {
        taskId: taskDetails._id,
        answerPdfId: currentBookletId,
        userId: taskDetails?.userId,
      });
    }
  }, [currentBookletId]); // ✅ ONLY dependency

  useEffect(() => {
    const allUsers = async () => {
      const response = await getAllUsers();
      console.log(response);
      setuserData(response);
    };
    allUsers();
  }, []);

  socket.on("questions-data", (data) => {
    const sorted = sortByQuestionsName(data.marks);
    setAllQuestions(sorted);

    const reducedArr = sorted
      .filter((item) => !item.isSubQuestion)
      .reduce((total, item) => total + item.allottedMarks, 0);

    const total = sorted
      .filter((item) => !item.isSubQuestion)
      .reduce((total, item) => total + item.maxMarks, 0);

    setTotalMarks(reducedArr);
    props.settotalMarksToDisplay(reducedArr);
    props.setTotalMarks(total);

    // ✅ ALWAYS set first question as default
    if (sorted.length > 0) {
      dispatch(setCurrentQuestionDefinitionId(sorted[0]._id));
      dispatch(setCurrentQuestion(parseFloat(sorted[0].questionsName)));
      dispatch(setCurrentSubQuestionParentId(sorted[0].parentQuestionId));
    }
  });

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
      userId: props.taskdetails.userId,
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
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Assigned to Principal successfully");
      navigate("/reviewer/assignedtasks");
    } catch (error) {
      console.error("Assign to principal failed", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign to principal"
      );
    }
  };

  const annotationOptions = [
    {
      value: "positive",
      label: "Opposite Right (Positive)",
    },
    { value: "negative", label: "Cross (Negative marking)" },
    { value: "circle", label: "Circle (O)" },
    { value: "line", label: "Line (|)" },
    { value: "slant", label: "Slanting Line ()" },
    { value: "question", label: "Question (?)" },
    { value: "blank", label: "Blank" },
    { value: "not_accept", label: "Not Accept" },
  ];

  const handleRotate = (index) => {
    setRotationStates({
      [index]: rotationStates[index] === 45 ? 0 : 45, // Toggle only the current index
    });
  };

  const handleListClick = async (item, mark, index) => {
    const { _id, answerPdfId, allottedMarks, maxMarks } = item;

    if (allottedMarks + mark > maxMarks) {
      alert("You have exceeded the maximum marks for this question");
      return;
    }
    const totalAllocatedMarks = allottedMarks + mark;
    try {
      const body = {
        questionDefinitionId: _id,
        answerPdfId: answerPdfId,
        allottedMarks: +mark,
        totalAllocatedMarks: totalAllocatedMarks,
        timerStamps: new Date().toLocaleString(),
      };
      dispatch(setCurrentQuestionDefinitionId(_id));
      dispatch(setCurrentMarkDetails(body));
      dispatch(setCurrentIcon("/check.png"));
      dispatch(setIsDraggingIcon(true));
      dispatch(setCurrentQuestion(parseFloat(item.questionsName)));
      // const response = await postMarkById(body);
      setMarked((prev) => !prev);
      setRotationStates({
        [index]: (rotationStates[index] = 0), // Toggle only the current index
      });
      // console.log(response);
    } catch (error) {}
  };
  // console.log(allQuestions);
  const QuestionData = allQuestions.map((item, index) => {
    const isRotated = rotationStates[index] === 45;
    const allotedMarks = item.allottedMarks;
    // console.log(item)
    const marks = generateNumbers(
      item.minMarks,
      item.maxMarks,
      item.marksDifference
    );
    const background =
      selectedQuestion === index
        ? allotedMarks !== 0
          ? "bg-green-300"
          : "bg-red-300"
        : allotedMarks === 0
        ? "bg-red-100"
        : "bg-green-100";
    // const background =
    //   allotedMarks !== 0
    //     ? selectedQuestion === index
    //       ? "bg-green-300" // Marks allocated and index matches
    //       : "bg-green-100" // Marks allocated and index doesn't match
    //     : selectedQuestion === index
    //     ? "bg-green-300" // No marks allocated but index matches
    //     : "bg-red-100"; // No marks allocated and index doesn't match
    const handleAllotZeroListClick = async (item, mark, index) => {
      const { _id, answerPdfId, allottedMarks } = item;

      try {
        const body = {
          questionDefinitionId: _id,
          answerPdfId: answerPdfId,
          allottedMarks: 0,
          timerStamps: new Date().toLocaleString(),
        };
        dispatch(setCurrentMarkDetails(body));
        dispatch(setCurrentIcon("/close.png"));
        dispatch(setIsDraggingIcon(true));
        dispatch(setCurrentQuestion(parseFloat(item.questionsName)));

        setMarked((prev) => !prev);
        setRotationStates({
          [index]: (rotationStates[index] = 0), // Toggle only the current index
        });
        // console.log(response);
      } catch (error) {}
      // console.log(item, mark);
    };

    return (
      <tr
        key={index}
        className="block w-full rounded-xl border-2 transition-all duration-200"
        style={{
          borderColor: allotedMarks === 0 ? "#ef4444" : "#22c55e",
          backgroundColor:
            selectedQuestion === index
              ? allotedMarks === 0
                ? "#fecaca"
                : "#bbf7d0"
              : allotedMarks === 0
              ? "#fee2e2"
              : "#dcfce7",
        }}
        onClick={() => {
          setSelectedQuestion(index);

          dispatch(setCurrentQuestionDefinitionId(allQuestions[index]._id));

          dispatch(setCurrentQuestion(parseFloat(item.questionsName)));

          dispatch(
            setCurrentSubQuestionParentId(allQuestions[index].parentQuestionId)
          );
        }}
      >
        <td className="flex w-full items-center justify-between px-1 py-1">
          {/* LEFT */}
          <div className="ml-5 flex w-[20%] flex-row text-[14px] font-semibold text-gray-800">
            Q{item.questionsName}
          </div>

          {/* RIGHT */}
          <div className="relative flex w-[80%] items-center justify-start gap-3">
            {/* PLUS ICON */}
            {!item.isSubQuestion && (
              <IconButton
                color={isRotated ? "warning" : "primary"}
                onClick={(e) => {
                  e.stopPropagation();
                  handleRotate(index);
                }}
                className="!p-1"
                style={{
                  transform: `rotate(${isRotated ? 45 : 0}deg)`,
                  transition: "transform 0.3s ease-in-out",
                }}
              >
                <AddCircleOutlineIcon fontSize="medium" />
              </IconButton>
            )}

            {/* INPUT */}
            <div className="flex items-center rounded-lg border border-gray-300 bg-white px-2 py-1 shadow-sm">
              <input
                className="bg-transparent h-7 w-full text-center text-[14px] font-semibold text-gray-700 focus:outline-none"
                value={allotedMarks}
                readOnly
              />
            </div>

            {/* MARKS DROPDOWN */}
            {isRotated && !item.isSubQuestion && (
              <div
                className="absolute left--2 top-12 z-10 ml-2 w-24 rounded-md border border-gray-300 bg-white shadow-lg"
                style={{
                  transform: "translateX(0)",
                }}
              >
                <p className="sticky top-0 bg-gray-200 text-center text-sm text-gray-700">
                  Select Marks
                </p>

                <ul className="m-0 max-h-[300px] list-none overflow-y-auto p-0 text-sm text-gray-700">
                  {marks.map((mark, i) => (
                    <li
                      key={i}
                      onClick={() => handleListClick(item, mark, index)}
                      className="cursor-pointer border-b py-1 text-center transition hover:bg-gray-200 hover:text-blue-500"
                    >
                      {mark}
                    </li>
                  ))}

                  <li
                    onClick={() => handleAllotZeroListClick(item, 0, index)}
                    className="cursor-pointer border-t bg-gray-100 py-1 text-center font-semibold hover:bg-gray-200 hover:text-red-500"
                  >
                    Allot 0
                  </li>
                </ul>
              </div>
            )}
          </div>
        </td>
      </tr>
    );
  });

  const handleIndexChange = async (taskId, nextIndex) => {
    const response = await changeCurrentIndexById(taskId, nextIndex);
    return response;
  };

  const handleNextBooklet = async () => {
    try {
      console.log("🟢 ===== START handleNextBooklet =====");

      dispatch(setIsLoadingTrue());

      // ✅ ALWAYS read fresh values
      const currentIndex = Number(taskDetails?.currentFileIndex);
      const total = Number(taskDetails?.totalBooklets);
      const taskId = taskDetails?._id;
      const bookletId = currentBookletId; // 🔥 use redux value

      // 🔴 CRITICAL DEBUG
      console.log("🧠 REAL STATE BEFORE SUBMIT:", {
        currentIndex,
        total,
        bookletId,
        taskId,
      });

      // 🚨 HARD GUARD (your logs showed this is undefined sometimes)
      if (!bookletId) {
        console.log("❌ STOP: bookletId is undefined");
        toast.error("Booklet not loaded properly");
        return;
      }

      const submitted = await submitCurrentBooklet();

      console.log("📌 STEP 2: SUBMIT RESULT", submitted);

      if (!submitted) {
        console.log("❌ STOP: Submission failed");
        return;
      }

      // 🔥 IMPORTANT: DO NOT reuse old index blindly
      const latestIndex = Number(taskDetails?.currentFileIndex);

      console.log("📌 STEP 3: INDEX CHECK", {
        latestIndex,
        total,
        isLast: latestIndex >= total - 1,
      });

      // 🚨 TEMP DEBUG OVERRIDE (to confirm bug source)
      // 👉 comment this later after fix
      if (latestIndex >= total) {
        console.log("🚨 DETECTED AS LAST — VERIFY IF CORRECT");

        // 👇 DEBUG: show user-visible index
        console.log("📊 HUMAN VIEW:", {
          uiPosition: latestIndex + 1,
          total,
        });

        toast.success("All booklets completed");
        navigate("/reviewer/assignedtasks");
        return;
      }

      const nextIndex = latestIndex + 1;

      console.log("📌 STEP 4: NEXT INDEX", {
        nextIndex,
        from: latestIndex,
      });

      // ✅ API update
      const apiResponse = await changeCurrentIndexById(taskId, nextIndex);

      console.log("🚨 AFTER UPDATE API:", {
        sentIndex: nextIndex,
        apiResponse,
      });

      // ✅ fetch updated
      const res = await getAllReviewerTasks();

      console.log("📡 STEP 6 DATA:", res?.data);

      const updatedTask = res?.data?.find((t) => t._id === taskId);

      if (!updatedTask) {
        console.log("❌ ERROR: updatedTask NOT FOUND");
        toast.error("Task not found");
        return;
      }

      console.log("📌 STEP 7A: BACKEND VALUES", {
        backendIndex: updatedTask.currentFileIndex,
        backendBookletId: updatedTask.currentBookletId,
      });

      // ✅ Redux sync
      dispatch(setCurrentTaskDetails(updatedTask));
      dispatch(setCurrentBookletIndex(updatedTask.currentFileIndex));
      const nextBooklet = res?.data?.find((t) => t._id === taskId)
        ?.answerPdfDetails?.[updatedTask.currentFileIndex - 1];

      console.log("📦 NEXT BOOKLET FROM ARRAY:", nextBooklet);

      dispatch({
        type: "evaluator/setCurrentBookletId",
        payload: nextBooklet?._id,
      });

      console.log("🔁 FINAL STATE CHECK:", {
        reduxIndex: updatedTask.currentFileIndex,
        reduxBookletId: updatedTask.currentBookletId,
      });

      console.log("✅ STEP 8: REDUX UPDATED");

      // ❌ REMOVE THIS (THIS IS BREAKING EVERYTHING)
      // window.location.reload();

      toast.success("Moved to next booklet");

      window.location.reload();

      console.log("🟢 ===== END handleNextBooklet =====");
    } catch (error) {
      console.log("❌ CATCH ERROR:", error);
      toast.error("Something went wrong");
    } finally {
      dispatch(setIsLoadingFalse());
      props.setsubmitModel(false);
    }
  };

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

      const res = await submitTaskByTyper(
        currentBookletId,
        taskDetails._id,
        timeTaken
      );

      if (!res.success) {
        toast.warning(res.message);
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

      const res = await submitTaskByTyper(
        currentBookletId,
        props.taskdetails.userId,
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

  // the Important

  // const rollback = async () => {
  //   console.log("ROLLBACK CLICKED");

  //   if (!selectedUser) {
  //     console.log("No user selected");
  //     return;
  //   }

  //   const obj = {
  //     assignments: [
  //       {
  //         evaluatorId: selectedUser,
  //         reviewerId: props.taskdetails.userId,
  //         subjectCode: props.taskdetails.subjectCode,
  //         questiondefinitionId: props.taskdetails.questiondefinitionId,
  //         bookletsToAssign: [currentBookletId],
  //       },
  //     ],
  //   };

  //   console.log("Payload:", obj);

  //   try {
  //     const response = await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-rollback`,
  //       obj,
  //       {
  //         headers: {
  //           Authorization: `Bearer ${token}`,
  //         },
  //       }
  //     );

  //     console.log("API success:", response.data);
  //   } catch (err) {
  //     console.error("Reassign failed", err);

  //     const message =
  //       err?.response?.data?.message || // old API format
  //       err?.response?.data?.error || // new API format
  //       err?.message || // axios/network errors
  //       "Something went wrong";

  //     toast.error(message);
  //   }
  // };

  // const rollback = async () => {
  //   console.log("ROLLBACK CLICKED");

  //   if (!selectedUser) {
  //     toast.warning("Please select a user");
  //     return;
  //   }

  //   const obj = {
  //     assignments: [
  //       {
  //         evaluatorId: selectedUser,
  //         reviewerId: props.taskdetails.userId,
  //         subjectCode: props.taskdetails.subjectCode,
  //         questiondefinitionId: props.taskdetails.questiondefinitionId,
  //         bookletsToAssign: [currentBookletId],
  //       },
  //     ],
  //   };

  //   try {
  //     dispatch(setIsLoadingTrue());

  //     await axios.post(
  //       `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-rollback`,
  //       obj,
  //       { headers: { Authorization: `Bearer ${token}` } }
  //     );

  //     toast.success("Booklet reassigned to evaluator");

  //     setshowRollbackModel(false); // ✅ close modal

  //     await goToNextBookletOrFinish(); // ✅ move forward like submit flow
  //   } catch (err) {
  //     console.error("Reassign failed", err);

  //     const message =
  //       err?.response?.data?.message ||
  //       err?.response?.data?.error ||
  //       err?.message ||
  //       "Something went wrong";

  //     toast.error(message);
  //   } finally {
  //     dispatch(setIsLoadingFalse());
  //   }
  // };

  const rollback = async () => {
    if (!remarkType) {
      toast.warning("Please select a remark type");
      return;
    }

    let remarkPayload = {};

    // ✅ Increase / Decrease
    if (remarkType === "increase" || remarkType === "decrease") {
      if (!range.from || !range.to) {
        toast.warning("Please enter valid range");
        return;
      }

      remarkPayload = {
        type: remarkType,
        range: {
          from: Number(range.from),
          to: Number(range.to),
        },
      };
    }

    // ✅ Annotation
    if (remarkType === "annotation") {
      if (!pageNumber) {
        toast.warning("Please enter page number");
        return;
      }

      if (!annotationType) {
        toast.warning("Please select annotation type");
        return;
      }

      remarkPayload = {
        type: "annotation",
        pageNumber: Number(pageNumber),
        annotationType,
      };
    }

    // ✅ Custom
    if (remarkType === "custom") {
      if (!customRemark.trim()) {
        toast.warning("Please enter remark");
        return;
      }

      remarkPayload = {
        type: "custom",
        comment: customRemark,
      };
    }

    try {
      dispatch(setIsLoadingTrue());

      // ✅ Detect Task Type
      const isBookletTask = !props.taskdetails.questiondefinitionId;

      // ✅ Dynamic API
      const apiUrl = isBookletTask
        ? `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-booklet-rollback`
        : `${process.env.REACT_APP_API_URL}/api/tasks/assign/reviewer-rollback`;

      // ✅ Dynamic Payload
      const payload = {
        assignments: [
          {
            reviewerId: props.taskdetails.userId,
            subjectCode: props.taskdetails.subjectCode,

            // only send for question-wise
            ...(isBookletTask
              ? {}
              : {
                  questiondefinitionId: props.taskdetails.questiondefinitionId,
                }),

            bookletsToAssign: [currentBookletId],

            remark: remarkPayload,
          },
        ],
      };

      console.log("ROLLBACK API:", apiUrl);
      console.log("ROLLBACK PAYLOAD:", payload);

      await axios.post(apiUrl, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Sent back to evaluator with remark");

      setshowRollbackModel(false);

      // ✅ Safe Index Handling
      const currentIndex = Number(taskDetails.currentFileIndex);
      const total = Number(taskDetails.totalBooklets);

      if (currentIndex === total) {
        await handleIndexChange(taskDetails._id, currentIndex);
      }

      await goToNextBookletOrFinish();

      window.location.reload();
    } catch (err) {
      console.error(err);

      toast.error(
        err?.response?.data?.message || err?.message || "Something went wrong"
      );
    } finally {
      dispatch(setIsLoadingFalse());
    }
  };

  const handleAssignToPrincipal = async () => {
    try {
      const token = localStorage.getItem("token");

      const payload = {
        questiondefinitionId: evaluatorState.currentQuestionDefinitionId,
        subjectCode: props.taskdetails?.subjectCode,
        reviewerid: props.taskdetails?.userId, // ✅ reviewerId = task.userId
        answerPdfId: currentBookletId,
      };

      console.log("Assign Payload:", payload);

      const res = await axios.post(
        `${process.env.REACT_APP_API_URL}/api/tasks/reviewer/rejectTask`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      toast.success(res.data?.message || "Assigned to Principal successfully");
      navigate("/reviewer/assignedtasks");
    } catch (error) {
      console.error("Assign to principal failed", error);
      toast.error(
        error?.response?.data?.message || "Failed to assign to principal"
      );
    }
  };

  return (
    <div className="h-[90%]">
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
        <div className="h-[calc(100%-4rem)] overflow-y-auto">
          {" "}
          {/* Adjust height as needed */}
          <table className="w-full text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right">
            <thead className="bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3 text-[12px]">
                  Q.No
                </th>
                <th scope="col" className="px-6 py-3 text-[12px]">
                  Alloted Marks
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colSpan={2}>
                  <div className="flex flex-col items-center gap-3 px-2 py-3">
                    {QuestionData}
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
            <span className="text-[12px] font-semibold text-gray-800 dark:text-white">
              TOTAL
            </span>

            {/* RIGHT */}
            <div className="text-sm font-semibold">
              <span className="text-[16px] font-bold text-blue-600">
                {totalMarks}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-2 px-3 py-3">
        <button
          type="button"
          // disabled={
          //   props.remainingSecondsRef / 60 < props.userTimerData.minTime
          // }
          onClick={() => setshowRollbackModel(true)}
          className={`mb-2 w-full rounded-lg border px-5 py-3 text-sm font-semibold transition
${
  props.remainingSecondsRef / 60 < props.userTimerData.minTime
    ? "cursor-not-allowed border-orange-700 bg-orange-700 opacity-60"
    : "cursor-pointer bg-orange-600 hover:bg-orange-700 focus:ring-4 focus:ring-orange-300"
}
text-white focus:outline-none`}
        >
          <div className="flex items-center justify-center gap-2">
            <FiX size={18} />
            RollBack to Evaluator
          </div>
        </button>
        <button
          type="button"
          disabled={
            props.remainingSecondsRef / 60 < props.userTimerData.minTime
          }
          onClick={handleSubmitConfirm}
          className={`w-full rounded-lg border px-5 py-3 text-sm font-semibold transition
${
  props.remainingSecondsRef / 60 < props.userTimerData.minTime
    ? "cursor-not-allowed border-green-700 bg-green-700 opacity-60"
    : "cursor-pointer bg-green-700 hover:bg-green-800 focus:ring-4 focus:ring-green-300"
}
text-white focus:outline-none`}
        >
          <div className="flex items-center justify-center gap-2">
            <IoPaperPlaneOutline size={18} />
            SUBMIT BOOKLET AND NEXT
          </div>
        </button>
      </div>

      {showRollbackModel && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[50%] rounded-lg bg-white p-6 shadow-lg">
            <h2 className="mb-4 text-lg font-semibold">Select Remark Type</h2>

            {/* OPTIONS */}
            <div className="space-y-3">
              {/* Increase */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="increase"
                  checked={remarkType === "increase"}
                  onChange={(e) => setRemarkType(e.target.value)}
                />
                Increase Marks
              </label>

              {remarkType === "increase" && (
                <div className="ml-5 flex gap-2">
                  <input
                    type="number"
                    placeholder="From"
                    value={range.from}
                    onChange={(e) =>
                      setRange({ ...range, from: e.target.value })
                    }
                    className="w-full rounded border p-2"
                  />
                  <input
                    type="number"
                    placeholder="To"
                    value={range.to}
                    onChange={(e) => setRange({ ...range, to: e.target.value })}
                    className="w-full rounded border p-2"
                  />
                </div>
              )}

              {/* Decrease */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="decrease"
                  checked={remarkType === "decrease"}
                  onChange={(e) => setRemarkType(e.target.value)}
                />
                Decrease Marks
              </label>

              {remarkType === "decrease" && (
                <div className="ml-5 flex gap-2">
                  <input
                    type="number"
                    placeholder="From"
                    value={range.from}
                    onChange={(e) =>
                      setRange({ ...range, from: e.target.value })
                    }
                    className="w-full rounded border p-2"
                  />
                  <input
                    type="number"
                    placeholder="To"
                    value={range.to}
                    onChange={(e) => setRange({ ...range, to: e.target.value })}
                    className="w-full rounded border p-2"
                  />
                </div>
              )}

              {/* Change Annotation */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="annotation"
                  checked={remarkType === "annotation"}
                  onChange={(e) => setRemarkType(e.target.value)}
                />
                Change Annotation
              </label>

              {remarkType === "annotation" && (
                <div className="ml-5 space-y-3">
                  {/* Page Input */}
                  <input
                    type="number"
                    placeholder="Enter Page Number"
                    value={pageNumber}
                    onChange={(e) => setPageNumber(e.target.value)}
                    className="w-full rounded border p-2"
                  />

                  {/* Annotation Type Dropdown */}
                  <select
                    value={annotationType}
                    onChange={(e) => setAnnotationType(e.target.value)}
                    className="w-full rounded border p-2"
                  >
                    <option value="">-- Select Annotation Type --</option>

                    {annotationOptions.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Custom */}
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  value="custom"
                  checked={remarkType === "custom"}
                  onChange={(e) => setRemarkType(e.target.value)}
                />
                Custom Remark
              </label>

              {remarkType === "custom" && (
                <textarea
                  placeholder="Enter remark..."
                  value={customRemark}
                  onChange={(e) => setCustomRemark(e.target.value)}
                  className="ml-5 w-full rounded border p-2"
                />
              )}
            </div>

            {/* Footer */}
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setshowRollbackModel(false)}
                className="rounded bg-gray-200 px-4 py-2"
              >
                Cancel
              </button>

              <button
                onClick={rollback}
                className="rounded bg-blue-600 px-4 py-2 text-white"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {props.submitModel && (
        <div className="bg-black fixed inset-0 z-50 flex items-center justify-center bg-opacity-50">
          <div className="w-[50%] rounded-lg bg-white p-6 shadow-lg">
            <div className="w-full rounded-lg border border-gray-300 bg-white p-3">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Marks Summary
              </h3>

              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="bg-gray-100 text-left">
                    <th className="border px-3 py-2">Question No</th>
                    <th className="border px-3 py-2 text-center">Marks</th>
                    <th className="border px-3 py-2 text-center">Page No</th>
                  </tr>
                </thead>

                <tbody>
                  {sortedMarksData.map((item) => {
                    const pageData = props.confirmationData?.marks?.find(
                      (m) => m.questionDefinitionId === item._id
                    );

                    return (
                      <tr key={item._id} className="hover:bg-gray-50">
                        {/* Question Number */}
                        <td className="border px-3 py-2 font-medium text-gray-800">
                          Q{item.questionsName}
                        </td>

                        {/* Marks */}
                        <td className="border px-3 py-2 text-center">
                          <span
                            className={`font-semibold ${
                              item.allottedMarks > 0
                                ? "text-green-700"
                                : "text-red-600"
                            }`}
                          >
                            {item.allottedMarks}
                          </span>
                          <span className="text-gray-500">
                            {" "}
                            / {item.maxMarks}
                          </span>
                        </td>

                        {/* Page Number */}
                        <td className="border px-3 py-2 text-center text-gray-700">
                          {(pageData?.page ?? null) !== null
                            ? Number(pageData.page) - 1
                            : "-"}
                        </td>
                      </tr>
                    );
                  })}
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

export default React.memo(ReviewerQuestion);
