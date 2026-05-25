// CheckModule.jsx (complete file)
import React, { useCallback, useEffect, useRef, useState } from "react";
import ImageContainer from "components/Imagecontainer/ImageContainer";
import { getUserDetails } from "services/common";
import { FiSearch } from "react-icons/fi";
import { RiMoonFill, RiSunFill } from "react-icons/ri";
import Dropdown from "components/dropdown";
import { Link, useNavigate, useParams } from "react-router-dom";
import QuestionSection from "components/QuestionSection/QuestionSection";
import { useSelector, useDispatch } from "react-redux";
import { logout } from "../../../store/authSlice";
import { FiClock } from "react-icons/fi";
import avatar from "assets/img/avatars/avatar4.png";
import {
  setIndex,
  setBaseImageUrl,
  setCurrentTaskDetails,
  setCurrentAnswerPdfImageId,
  setCurrentAnswerPdfId,
  setCurrentBookletId,
} from "store/evaluatorSlice";
import ProgressBar from "./ProgressBar";
import {
  // // getTaskById,
  // getAnswerPdfById,
  resolveAndUpdateAnswerPdfById,
  resolveAndGetAnswerImagesById,
  submitImageById,
} from "components/Helper/Evaluator/EvalRoute";
import { resolveAndGetTaskById } from "components/Helper/Evaluator/EvalRoute";
import { setCurrentBookletIndex } from "store/evaluatorSlice";
import EvalQuestionModal from "components/modal/EvalQuestionModal";
import LineLoader from "UI/LineLoader/LineLoader";
import { io } from "socket.io-client";
import useInactivityLogout from "../../../hook/InactivityTracker";
import { toast } from "react-toastify";
const CheckModule = () => {
  const [answerSheetCount, setAnswerSheetCount] = useState(null);
  const [answerImageDetails, setAnswerImageDetails] = useState([]);
  const [answerPdfDetails, setAnswerPdfDetails] = useState(null);
  const [showloader, setShowLoader] = useState(false);
  const [imageObj, setImageObj] = useState(null);
  const [taskdetails, settaskdetails] = useState({});
  const [totalMarksToDisplay, settotalMarksToDisplay] = useState(null);
  const [TotalMarks, setTotalMarks] = useState(null);
  const hasInitializedIndex = useRef(false);
  const [submitModel, setsubmitModel] = useState(false);
  const [schemaDetails, setschemaDetails] = useState(null);

  // Local timer display string (HH:MM:SS)
  const [remainingTimeStr, setRemainingTimeStr] = useState("00:00:00");
  // numeric seconds remaining from server
  const remainingSecondsRef = useRef(null);
  const pageTimer = useRef(null);
  // server paused flag
  const isPausedRef = useRef(true);
  // interval id for local ticking
  const tickIntervalRef = useRef(null);
  const PagetickIntervalRef = useRef(null);

  const [timeInSeconds, settimeInSeconds] = useState(0);

  const evaluatorState = useSelector((state) => state.evaluator);
  const currentIndex = evaluatorState.currentIndex;
  // console.log(currentIndex);
  const taskDetails = evaluatorState?.currentTaskDetails;
  const currentBookletIndex = evaluatorState.currentBookletIndex;
  const currentAnswerPdfId = evaluatorState.currentAnswerPdfId;
  const icons = evaluatorState.icons;
  const rerenderer = evaluatorState.rerender;
  const currentTaskDetails = evaluatorState.currentTaskDetails;
  const { id } = useParams();
  const [userTimerData, setuserTimerData] = useState({});
  const [pageTimerCount, setpageTimerCount] = useState("00:00:00");
  const [blankCheck, setblankCheck] = useState(false);
  const [confirmationData, setconfirmationData] = useState({
    marks: [],
    marksData: [],
  });

  const [socket, setSocket] = useState(null);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [questionDef, setquestionDef] = useState({});

  // console.log(totalMarksToDisplay);
  // console.log(TotalMarks);
  // token MUST be defined before socket connect code
  const token =
    useSelector((state) => state.auth.token) || localStorage.getItem("token");

  // ---------- Helper: format seconds -> HH:MM:SS ----------
  const formatSeconds = (tot) => {
    if (tot == null || isNaN(tot)) return "00:00:00";
    const s = Math.max(0, Math.floor(tot));
    const hrs = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    const pad = (n) => String(n).padStart(2, "0");
    return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
  };

  // ---------- Start/stop local ticking ----------
  const startLocalTick = useCallback(() => {
    clearInterval(tickIntervalRef.current);
    tickIntervalRef.current = setInterval(() => {
      // decrement local seconds
      if (
        typeof remainingSecondsRef.current === "number" &&
        !isPausedRef.current
      ) {
        remainingSecondsRef.current = Math.max(
          0,
          remainingSecondsRef.current + 1
        );
        setRemainingTimeStr(formatSeconds(remainingSecondsRef.current));
        settimeInSeconds(remainingSecondsRef.current);
      }
    }, 1000);
  }, [answerPdfDetails]);
  const startLocalTickPage = useCallback(() => {
    if (PagetickIntervalRef.current) return;
    pageTimer.current = 0;
    PagetickIntervalRef.current = setInterval(() => {
      // decrement local seconds
      if (typeof pageTimer.current === "number") {
        pageTimer.current = Math.max(0, pageTimer.current + 1);
        setpageTimerCount(formatSeconds(pageTimer.current));
      }
    }, 1000);
  }, [answerPdfDetails]);

  const stopLocalTickPage = useCallback(() => {
    if (PagetickIntervalRef.current) {
      clearInterval(PagetickIntervalRef.current);
      PagetickIntervalRef.current = null;
    }
  }, []);
  const stopLocalTick = useCallback(() => {
    if (remainingSecondsRef.current) {
      remainingSecondsRef.current = null;
    }
  }, []);
  // useEffect(() => {
  //   return () => {
  //     stopLocalTick();
  //   };
  // }, [answerPdfDetails]);

  useEffect(() => {
    if (blankCheck) {
      stopLocalTickPage(); // ⛔ stop timer
    } else {
      startLocalTickPage(); // ▶ resume timer
    }
  }, [
    blankCheck,
    startLocalTickPage,
    stopLocalTickPage,
    evaluatorState.currentIndex,
  ]);

  useEffect(() => {
    return () => {
      stopLocalTickPage();
    };
  }, [evaluatorState.currentIndex, stopLocalTickPage, answerPdfDetails]);

  // console.log(pageTimerCount);

  // const stopLocalTick = useCallback(() => {
  //   if (tickIntervalRef.current) {
  //     clearInterval(tickIntervalRef.current);
  //     tickIntervalRef.current = null;
  //   }
  // }, []);

  // ---------- Socket: register handlers once, emit where needed ----------
  useEffect(() => {
    if (!id || !answerPdfDetails || socket) return;

    const taskId = id;
    const answerPdfId = answerPdfDetails._id;

    const newSocket = io(process.env.REACT_APP_API_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
    });
    setSocket(newSocket);

    newSocket.on("room-joined", (data) => {
      console.log("room-joined:", data);
    });

    newSocket.on("start-timer-update", (data) => {
      // console.log("⏱ Received start-timer-update:", data);

      remainingSecondsRef.current = data.remainingTime * 60;
      setuserTimerData(data);
      isPausedRef.current = false;
      // console.log(data);
      // Start ticking as soon as we get timer
      startLocalTick();
    });
    newSocket.on("connect", () => {
      // console.log("Socket connected:", newSocket.id);

      newSocket.emit("join-timerRoom", { taskId });
      newSocket.emit("start-evaluation", { taskId, answerPdfId });
    });

    return () => {
      newSocket.disconnect();
    };
  }, [id, answerPdfDetails, token]);

  // console.log(remainingSecondsRef.current);
  useEffect(() => {
    if (!socket || !id || !answerPdfDetails) return;

    const taskId = id;
    const answerPdfId = answerPdfDetails._id;

    const intervalId = setInterval(() => {
      const remainingTime = remainingSecondsRef.current / 60;

      if (typeof remainingTime === "number") {
        socket.emit("timer-update", {
          taskId,
          answerPdfId,
          remainingTime,
        });

        // console.log("📤 Sent timer update:", {
        //   taskId,
        //   answerPdfId,
        //   remainingTime,
        // });
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [socket, id, answerPdfDetails]);

  useEffect(() => {
    if (!socket) return;

    const handleAnnotations = (data) => {
      // console.log("Annotations:", data);
    };

    socket.on("annotations-updated", handleAnnotations);

    // Cleanup
    return () => {
      socket.off("annotations-updated", handleAnnotations);
    };
  }, [socket]);

  useInactivityLogout(() => {
    dispatch(logout());
    navigate("/auth/sign-in");
  });

  //   useEffect(() => {
  //   if (!id || !answerPdfDetails || !socket) return;

  //   const taskId = id;
  //   const answerPdfId = answerPdfDetails._id;

  //   // ✅ emit request
  //   socket.emit("get-marks-data", {
  //     taskId,
  //     answerPdfId,
  //     userId: currentTaskDetails?.userId,
  //   });

  //   // ✅ named handler
  //   const handleFinalMarksData = (data) => {
  //     console.log("final-marks-data:", data);
  //     setconfirmationData(data);
  //   };

  //   // ✅ register listener
  //   socket.on("final-marks-data", handleFinalMarksData);

  //   // ✅ cleanup (VERY IMPORTANT)
  //   return () => {
  //     socket.off("final-marks-data", handleFinalMarksData);
  //   };

  // }, [id, answerPdfDetails, submitModel, socket]);

  // console.log(answerPdfDetails);

  // -----------------------------------------------------------------
  // Keep your existing data-fetching useEffects — only change: after
  // fetch of task and answerPdfDetails the socket useEffect above will run.
  // -----------------------------------------------------------------
  useEffect(() => {
    const getTaskDetails = async () => {
      try {
        setShowLoader(true);
        const response = await resolveAndGetTaskById(id);
        // console.log(response);
        settaskdetails(response?.task);
        const {
          answerPdfDetails,
          extractedBookletPath,
          task,
          questionImagesFolderUrl,
          questionDef,
          schemaDetails,
          questionImages,
        } = response;

        console.log(response);
        setquestionDef(questionDef);
        setschemaDetails(schemaDetails);
        setAnswerPdfDetails(answerPdfDetails);
        dispatch(setCurrentAnswerPdfId(answerPdfDetails._id));
        dispatch(setCurrentTaskDetails(task));
        dispatch(setCurrentBookletIndex(task.currentFileIndex));
        dispatch(setCurrentBookletId(answerPdfDetails._id));
        dispatch(setBaseImageUrl(questionImagesFolderUrl));
        setAnswerSheetCount(answerPdfDetails);
      } catch (error) {
        console.log(error);
      } finally {
        setShowLoader(false);
      }
    };
    if (id) getTaskDetails();
  }, [id, currentBookletIndex, dispatch]);
  // console.log(questionDef);

  useEffect(() => {
    if (
      hasInitializedIndex.current ||
      !answerImageDetails?.length ||
      !answerImageDetails[0]?.name
    ) {
      return;
    }

    const index = answerImageDetails[0].name.split("_")[1].split(".")[0];
    console.log(index);
    dispatch(setIndex({ index }));

    hasInitializedIndex.current = true; // ✅ lock it forever
  }, [answerImageDetails, dispatch, taskDetails]);

  // console.log(evaluatorState.currentIndex);

  useEffect(() => {
    const getEvaluatorTasks = async (taskId) => {
      try {
        // const res = await getAnswerPdfById(taskId);
        // console.log(res);
        // // dispatch(
        // //   setCurrentAnswerPdfImageId(res[evaluatorState.currentIndex]._id)
        // // );
        // // console.log(res[evaluatorState.currentIndex]._id)
        // setAnswerImageDetails(res);
        // console.log(res)

        const res = await resolveAndGetAnswerImagesById(
          answerSheetCount._id, // answerPdfId
          id // taskId
        );

        console.log("📦 Raw Image API Response:", res);

        // Normalize Response → ALWAYS ARRAY
        const normalizedImages = Array.isArray(res)
          ? res
          : res?.data
          ? res.data
          : res?.images
          ? res.images
          : res?.answerImages
          ? res.answerImages
          : [];

        console.log("✅ Normalized Images:", normalizedImages);

        setAnswerImageDetails(normalizedImages);
      } catch (error) {
        console.log(error);
      }
    };
    if (answerSheetCount) {
      getEvaluatorTasks(answerSheetCount._id);
    }
    if (icons.length > 0) {
      getEvaluatorTasks(answerSheetCount?._id);
    }
  }, [
    evaluatorState.currentIndex,
    answerSheetCount,
    rerenderer,
    dispatch,
    icons,
  ]);

  // console.log(answerPdfDetails)
  // console.log(currentTaskDetails)

  const isDisabled = pageTimer.current > schemaDetails?.perPage || blankCheck;

  // ---- Image icons & handling (unchanged) ----
  const svgFiles = [
    "/pageicons/red.png",
    "/pageicons/green.png",
    "/pageicons/yellow.png",
  ];
  const textColorMap = {
    notVisited: "text-red-700",
    visited: "text-yellow-700",
    submitted: "text-green-800",
  };
  const Imgicons = Array.isArray(answerImageDetails)
    ? answerImageDetails.map((item, index) => {
        const isActive =
          String(item.name.split("_")[1].split(".")[0]) ===
          String(evaluatorState.currentIndex);
        // console.log(item.name.split("_")[1].split(".")[0])
        // console.log(evaluatorState.currentIndex)

        const statusBgMap = {
          notVisited: "bg-red-200",
          visited: "bg-yellow-200",
          submitted: "bg-green-200",
        };

        const bgClass = statusBgMap[item.status] || "bg-gray-200";

        return (
          <div
            key={index}
            onClick={() => {
              if (!isDisabled) {
                toast.warning("spend atleast 15 seconds");
                return;
              }

              handleUpdateImageDetail(item, index);
            }}
            className={`
  relative mb-2 mt-2 flex h-14 w-14
  cursor-pointer items-center
  justify-center rounded-lg text-sm
  font-semibold transition-all duration-200

  ${bgClass}

  ${
    isActive
      ? "border-2 border-white ring-2 ring-blue-500"
      : "border border-dashed border-blue-400"
  }

  hover:scale-105
`}
          >
            <span
              className={`absolute left-1 top-1 h-2.5 w-2.5 rounded-full ${
                item.status === "notVisited"
                  ? "bg-red-500"
                  : item.status === "visited"
                  ? "bg-yellow-500"
                  : item.status === "submitted"
                  ? "bg-green-600"
                  : "bg-gray-400"
              }`}
            />
            <div
              className={`text-[16px] font-bold ${
                textColorMap[item.status] || "text-gray-700"
              }`}
            >
              {index + 1}
            </div>
          </div>
        );
      })
    : [];

  const allPagesVisited = answerImageDetails.every(
    (page) => page.status !== "notVisited"
  );

  const handleUpdateImageDetail = async (item, index) => {
    // console.log(item, currentIndex);
    try {
      if (item.status === "notVisited") {
        await resolveAndUpdateAnswerPdfById(
          item._id,
          "visited",
          id // 👈 taskId required for routing
        );
      }
      const obj = {
        image: "captured_image.png",
        imageName: item.name,
        bookletName: answerPdfDetails.answerPdfName,
        subjectCode: currentTaskDetails.subjectCode,
      };
      setImageObj(obj);
      dispatch(setCurrentAnswerPdfImageId(item._id));
      // const name =  item.name.split("_")[1].split(".")[0];
      // console.log(name)
      dispatch(setIndex({ index: item.name.split("_")[1].split(".")[0] }));

      const onImageCaptured = async (blob) => {
        if (blob) {
          const formData = new FormData();
          formData.append("image", blob, "captured_image.png");
          formData.append("imageName", item.name);
          formData.append("bookletName", answerPdfDetails.answerPdfName);
          formData.append("subjectCode", currentTaskDetails.subjectCode);
          await submitImageById(formData);
        } else {
          console.error("Failed to capture the image");
        }
      };
      onImageCaptured();

      setTimeout(() => {
        const btn = document.getElementById("download-png");
        if (btn) btn.click();
      }, 500);
    } catch (error) {
      console.log(error);
    }
  };

  // console.log( currentIndex )

  // ---------- user/profile fetching - unchanged ----------
  const [darkmode, setDarkmode] = useState(false);
  const [userDetails, setUserDetails] = useState("");
  const [questionModal, setShowQuestionModal] = useState(false);
  const authState = useSelector((state) => state.auth);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await getUserDetails(token);
        setUserDetails(response.data);
      } catch (error) {
        console.log(error);
      }
    };
    if (authState.isAuthenticated !== undefined) fetchData();
  }, [authState.isAuthenticated, token]);

  // console.log(schemaDetails)

  // ---------- Render ----------
  if (showloader) {
    return (
      <div className="bg-transparent flex h-screen items-center justify-center">
        <LineLoader />
      </div>
    );
  } else {
    return (
      <>
        <div className="flex w-full items-center border-b bg-white px-6 shadow-sm">
          {/* LEFT SECTION */}
          <div className="flex w-[50%] items-center">
            {/* 20% → LOGO */}
            <div className="flex w-[10%] justify-start">
              <img src="/ios.png" alt="logo" className=" h-14 w-14" />
            </div>

            <div className=" mt-1 h-14 w-0.5 bg-gray-300" />

            {/* 30% → DETAILS */}
            <div className="ml-5 flex w-[25%] flex-col justify-start text-sm">
              <div className="mb-2 text-gray-700">
                <span className="text-[16px] font-medium">Evaluator ID:</span>{" "}
                <span className="text-[16px] font-semibold">
                  {taskDetails?.username}
                </span>
              </div>

              <div className="mb-2 text-gray-500">
                <span className="text-[16px] font-medium">Subject:</span>{" "}
                <span className="text-[16px] font-semibold">
                  {taskDetails?.subjectCode}
                </span>
              </div>
            </div>

            <div className="mr-7 mt-1 h-14 w-0.5 bg-gray-300" />

            {/* 50% → BOOKLET + PROGRESS */}
            <div className="flex w-[40%] flex-col  justify-center">
              <div className="items-center justify-center text-[16px] font-medium text-gray-700">
                Current Booklet:{" "}
                <span className="font-semibold">
                  {taskDetails?.currentFileIndex || "1"} of{" "}
                  {taskDetails?.totalBooklets}
                </span>
              </div>

              <div className="mt-1 flex items-center gap-2">
                <span className="whitespace-nowrap rounded-md border bg-red-500 px-1 py-0.5 text-[12px] font-semibold text-white">
                  {totalMarksToDisplay}/{userTimerData?.maxMarks}
                </span>
                <div className="h-3 w-1/3 overflow-hidden rounded-full bg-gray-200">
                  <div
                    className="h-full bg-blue-600"
                    style={{
                      width: `${
                        (totalMarksToDisplay / userTimerData?.maxMarks) * 100
                      }%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CENTER SECTION */}
          <div className="flex w-[30%] items-center justify-center">
            <div className=" flex flex-1 items-center justify-center gap-20">
              {/* PAGE TIMER */}
              <div className="flex items-center gap-3 rounded-md bg-gray-100 px-3 py-1">
                {/* ICON */}
                <FiClock className="text-xl text-gray-700" />

                {/* TEXT */}
                <div className="flex flex-col leading-tight">
                  <span className="text-[14px] font-bold tracking-wide text-gray-900">
                    PAGE
                  </span>
                  <span className="text-[14px] font-semibold text-gray-900">
                    {pageTimerCount}
                  </span>
                </div>
              </div>

              {/* EVAL TIMER */}
              <div className="flex items-center gap-3 rounded-md bg-gray-100 px-3 py-1">
                {/* ICON */}
                <FiClock className="text-xl text-gray-700" />

                {/* TEXT */}
                <div className="flex flex-col leading-tight">
                  <span className="text-[14px] font-bold tracking-wide text-gray-900">
                    EVAL
                  </span>
                  <span
                    className={`text-[14px] font-semibold ${
                      remainingSecondsRef.current / 60 > userTimerData.maxTime
                        ? "text-red-500"
                        : "text-gray-800"
                    }`}
                  >
                    {remainingTimeStr}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT SECTION */}
          <div className="flex w-[20%] items-center justify-end gap-4">
            {/* DARK MODE */}
            <div
              className="mx-5 cursor-pointer rounded-full p-2 text-2xl hover:bg-gray-100"
              onClick={() => {
                if (darkmode) {
                  document.body.classList.remove("dark");
                  setDarkmode(false);
                } else {
                  document.body.classList.add("dark");
                  setDarkmode(true);
                }
              }}
            >
              {darkmode ? <RiSunFill /> : <RiMoonFill />}
            </div>

            {/* PROFILE */}
            <Dropdown
              button={
                <img
                  className="mr-10 h-9 w-9 cursor-pointer rounded-full"
                  src={avatar}
                  alt="avatar"
                />
              }
              children={
                <div className="flex w-56 flex-col rounded-xl bg-white shadow-lg">
                  <div className="p-4">
                    <p className="text-sm font-semibold">
                      👋 Hey, {userDetails?.name}
                    </p>
                  </div>

                  <div className="border-t" />

                  <div className="flex flex-col gap-2 p-4">
                    <button
                      onClick={() => navigate("/admin/profile")}
                      className="text-left text-sm hover:text-blue-600"
                    >
                      Profile
                    </button>

                    <button
                      onClick={() => {
                        dispatch(logout());
                        navigate("/auth/sign-in");
                      }}
                      className="text-left text-sm text-red-500"
                    >
                      Log Out
                    </button>
                  </div>
                </div>
              }
              classNames={"py-2 top-10 -left-[160px]"}
            />
          </div>
        </div>

        <div className="flex h-screen w-full flex-row overflow-hidden">
          {/* LEFT SIDEBAR */}
          <div className="flex h-full w-[13%] flex-col bg-[#F3F4F6] sm:w-[20%] md:w-[14%] lg:w-[13%]">
            {/* HEADER */}
            <div className="sticky top-0 z-10 border-b bg-white px-2 py-2 text-center shadow-sm">
              <h2 className="p-2 text-[20px] font-semibold text-gray-700 md:text-[17px]">
                Answer Sheet Count
                <span className="ml-1 font-bold">{Imgicons?.length || 0}</span>
              </h2>
            </div>

            {/* ✅ ONLY ICONS SCROLL */}
            <div className="scrollbar-hide flex-1 overflow-y-auto">
              <div className="mt-2 grid grid-cols-1 place-items-center bg-[#F5F5F5] md:grid-cols-1 lg:grid-cols-3">
                {Imgicons}
              </div>
            </div>

            {/* ✅ LEGEND (FIXED, NOT SCROLLING) */}
            <div className="space-y-1 bg-[#F3F4F6] px-3 py-2 text-xs text-gray-600">
              <div className="mb-2 flex items-center gap-3 text-[16px] font-semibold text-gray-900">
                <span className="h-5 w-5 rounded-full bg-red-500" />
                Not View
              </div>
              <div className="mb-2 flex items-center gap-3 text-[16px] font-semibold text-gray-900">
                <span className="h-5 w-5 rounded-full bg-yellow-500" />
                View
              </div>
              <div className="flex items-center gap-3 text-[16px] font-semibold text-gray-900">
                <span className="h-5 w-5 rounded-full bg-green-600" />
                Completed
              </div>
            </div>

            {/* ✅ BUTTON FIXED AT BOTTOM */}
            <div className="border-t bg-white p-2">
              <button
                type="button"
                className="text-md w-full rounded-lg bg-[#3E5C8A] py-2 font-medium text-white transition hover:bg-[#2f4a73]"
                onClick={() => setShowQuestionModal(true)}
              >
                Show Questions
              </button>
            </div>
          </div>

          {/* IMAGE CONTAINER (UNCHANGED) */}
          <div
            id="imgcontainer"
            className="scrollbar-hide h-full flex-grow overflow-y-auto"
          >
            <ImageContainer
              ImageObj={imageObj}
              id={id}
              taskdetails={taskdetails}
              setblankCheck={setblankCheck}
              userDetails={userDetails}
            />
          </div>

          {/* RIGHT PANEL (UNCHANGED) */}
          <div className="scrollbar-hide h-full overflow-y-auto sm:w-[25%] md:w-[17%] lg:block lg:w-[17%]">
            <QuestionSection
              answerPdfDetails={answerSheetCount}
              taskdetails={taskdetails}
              remainingSecondsRef={remainingSecondsRef.current}
              userTimerData={userTimerData}
              settotalMarksToDisplay={settotalMarksToDisplay}
              setTotalMarks={setTotalMarks}
              setsubmitModel={setsubmitModel}
              submitModel={submitModel}
              allPagesVisited={allPagesVisited}
              socket={socket}
              id={id}
              setconfirmationData={setconfirmationData}
              confirmationData={confirmationData}
              answerPdfDetailsId={answerPdfDetails}
              schemaDetails={schemaDetails}
            />
          </div>
        </div>

        {questionModal && (
          <EvalQuestionModal
            show={questionModal}
            onHide={() => setShowQuestionModal(false)}
          />
        )}
      </>
    );
  }
};

export default CheckModule;
