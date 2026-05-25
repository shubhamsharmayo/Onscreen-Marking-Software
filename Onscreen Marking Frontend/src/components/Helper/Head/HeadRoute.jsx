import axios from "axios";
import { jwtDecode } from "jwt-decode";

export const getAllReviewerTasks = async () => {
  const token = localStorage.getItem("token");
  const userInfo = jwtDecode(token);
  const userID = userInfo.userId;
  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/getall/tasks/${userID}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

// export const getTaskById = async (taskId) => {
//   const token = localStorage.getItem("token");

//   try {
//     const response = await axios.get(
//       `${process.env.REACT_APP_API_URL}/api/tasks/get/task/${taskId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data; // return the full response to handle status outside
//   } catch (error) {
//     console.error(error);
//     return error.response; // return full error response to handle status outside
//   }
// };

// export const getTaskById = async (taskId) => {
//   const token = localStorage.getItem("token");

//   try {
//     const response = await axios.get(
//       `${process.env.REACT_APP_API_URL}/api/tasks/get/reviewerTask/${taskId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data; // return the full response to handle status outside
//   } catch (error) {
//     console.error(error);
//     return error.response; // return full error response to handle status outside
//   }
// };

export const resolveAndGetTaskByIds = async (taskId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ Token Missing");
    return;
  }

  const userInfo = jwtDecode(token);
  const userID = userInfo.userId;

  try {
    console.log("📌 Requested TaskId:", taskId);

    // -------------------------------
    // 1️⃣ Get All Tasks Of Evaluator
    // -------------------------------
    const allTaskRes = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/getall/tasks/${userID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    console.log("📦 All Task Response:", allTaskRes.data);

    // ⚠️ Backend returning ARRAY not object.tasks
    const taskList = Array.isArray(allTaskRes.data)
      ? allTaskRes.data
      : allTaskRes.data?.tasks || allTaskRes.data?.data || [];

    if (!taskList.length) {
      throw new Error("No tasks found for evaluator");
    }

    // -------------------------------
    // 2️⃣ Match Task From URL ID
    // -------------------------------
    const task = taskList.find((t) => String(t._id) === String(taskId));

    console.log("🎯 Matched Task:", task);

    if (!task) {
      throw new Error("Task not found in evaluator list");
    }

    const type = task.taskType?.toLowerCase().trim();

    console.log("🧠 Normalized TaskType:", type);

    let finalResponse;

    // -------------------------------
    // 3️⃣ Route API Based On taskType
    // -------------------------------
    if (type === "booklet") {
      console.log("📘 Calling Booklet API");

      finalResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/get/reviewerBookletTask/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else if (type === "question" || type === "questions") {
      console.log("❓ Calling Question API");

      finalResponse = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/tasks/get/reviewerTask/${taskId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else {
      console.error("❌ Invalid taskType:", type);
      throw new Error("Invalid taskType");
    }

    console.log("✅ Final API Response:", finalResponse.data);

    return finalResponse.data;
  } catch (error) {
    console.error("🚨 Dynamic Task Resolver Error:", error);
    return error?.response?.data || error;
  }
};

// export const getAnswerPdfById = async (answerPdfId) => {
//   const token = localStorage.getItem("token");

//   try {
//     const response = await axios.get(
//       `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/getall/answerpdfimage/${answerPdfId}`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data; // return the full response to handle status outside
//   } catch (error) {
//     console.error(error);
//     return error.response; // return full error response to handle status outside
//   }
// };

export const resolveAndGetAnswerImagesByIds = async (answerPdfId, taskId) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ Token Missing");
    return [];
  }

  const userInfo = jwtDecode(token);
  const userID = userInfo.userId;

  try {
    // -------------------------------
    // 1️⃣ Get Evaluator Task List
    // -------------------------------
    const allTaskRes = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/getall/tasks/${userID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const taskList = Array.isArray(allTaskRes.data)
      ? allTaskRes.data
      : allTaskRes.data?.tasks || allTaskRes.data?.data || [];

    const task = taskList.find((t) => String(t._id) === String(taskId));

    if (!task) {
      console.error("❌ Task Not Found");
      return [];
    }

    const type = task.taskType?.toLowerCase().trim();

    console.log("🧠 Image API TaskType:", type);

    let response;

    // -------------------------------
    // 2️⃣ Route Image API
    // -------------------------------
    if (type === "question" || type === "questions") {
      console.log("❓ Question Image API Hit");

      response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/getall/answerpdfimage/${answerPdfId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else if (type === "booklet") {
      console.log("📘 Booklet Image API Hit");

      response = await axios.get(
        `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/getall/bookletanswerpdfimage/${answerPdfId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else {
      console.error("❌ Unknown taskType:", type);
      return [];
    }

    console.log("📦 Raw Image API Response:", response.data);

    // -------------------------------
    // 3️⃣ Normalize Response → ARRAY
    // -------------------------------
    const normalizedImages = Array.isArray(response.data)
      ? response.data
      : response.data?.data
      ? response.data.data
      : response.data?.images
      ? response.data.images
      : response.data?.answerImages
      ? response.data.answerImages
      : [];

    console.log("✅ Normalized Images:", normalizedImages);

    return normalizedImages;
  } catch (error) {
    console.error("🚨 Answer Image Resolver Error:", error);
    return [];
  }
};

export const getQuestionSchemaById = async (taskId, answerPdfId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/get/questiondefinition?answerPdfId=${answerPdfId}&taskId=${taskId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};
// export const updateAnswerPdfById = async (answerPdfId, status) => {
//   const token = localStorage.getItem("token");

//   try {
//     const response = await axios.put(
//       `${process.env.REACT_APP_API_URL}/api/evaluation/revieweranswerimages/update/answerpdfimage/${answerPdfId}`,
//       { status: status },
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data; // return the full response to handle status outside
//   } catch (error) {
//     console.error(error);
//     return error.response; // return full error response to handle status outside
//   }
// };

export const resolveAndUpdateAnswerPdfByIds = async (
  answerPdfId,
  status,
  taskId
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ Token Missing");
    return;
  }

  const userInfo = jwtDecode(token);
  const userID = userInfo.userId;

  try {
    // -------------------------------
    // 1️⃣ Get Evaluator Task List
    // -------------------------------
    const allTaskRes = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/getall/tasks/${userID}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const taskList = Array.isArray(allTaskRes.data)
      ? allTaskRes.data
      : allTaskRes.data?.tasks || allTaskRes.data?.data || [];

    const task = taskList.find((t) => String(t._id) === String(taskId));

    if (!task) {
      console.error("❌ Task Not Found");
      return;
    }

    const type = task.taskType?.toLowerCase().trim();

    console.log("🧠 Update API TaskType:", type);

    let response;

    // -------------------------------
    // 2️⃣ Route Update API
    // -------------------------------
    if (type === "question" || type === "questions") {
      response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/update/answerpdfimage/${answerPdfId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else if (type === "booklet") {
      response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/update/bookletanswerpdfimage/${answerPdfId}`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else {
      console.error("❌ Unknown taskType:", type);
      return;
    }

    return response.data;
  } catch (error) {
    console.error("🚨 Update Resolver Error:", error);
    return error?.response?.data || error;
  }
};

export const postMarkById = async (body) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/evaluation/marks/create`,
      body,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

export const changeCurrentIndexById = async (id, nextIndex) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.put(
      `${process.env.REACT_APP_API_URL}/api/tasks/update/task/currentIndex/${id}`,
      { currentIndex: nextIndex },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

export const createIcon = async (body) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/evaluation/icons/create`,
      { ...body },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

export const getIconsByImageId = async (
  questionDefinitionId,
  answerPdfImageId
) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/evaluation/icons/geticons?questionDefinitionId=${answerPdfImageId}&answerPdfImageId=${questionDefinitionId}
      `,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

export const deleteIconByImageId = async (iconId, answerPdfId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.delete(
      `${process.env.REACT_APP_API_URL}/api/evaluation/icons/remove?iconsId=${iconId}&answerPdfId=${answerPdfId}
      `,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};
// /api/evaluation/icons/removeall

export const getSubjectIdImgUrl = async (subjectCode, questionDefinitionId) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/subjects/relations/getallcoordinatesandschemarelationdetails?subjectcode=${subjectCode}&questionDefinitionId=${questionDefinitionId}
      `,

      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response; // return full error response to handle status outside
  }
};

// export const getStarted = async () => {
//   const token = localStorage.getItem("token");
//   try {
//     const response = await axios.get(
//       `${process.env.REACT_APP_API_URL}/api/getData`,
//       {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       }
//     );
//     return response.data;
//   } catch (error) {
//     return error.response;
//   }
// };

// export const submitBookletById = async (
//   answerPdfId,
//   userId,
//   timeTakenInMinutes
// ) => {
//   const token = localStorage.getItem("token");

//   const response = await axios.put(
//     `${process.env.REACT_APP_API_URL}/api/tasks/completedbooklet/${answerPdfId}/${userId}`,
//     {
//       submitted: timeTakenInMinutes, // ✅ minutes only
//     },
//     {
//       headers: {
//         Authorization: `Bearer ${token}`,
//       },
//     }
//   );

//   return response.data;
// };

export const submitTaskByTyper = async (
  answerPdfId,
  taskId,
  timeTakenInMinutes
) => {
  const token = localStorage.getItem("token");

  if (!token) {
    console.error("❌ Token Missing");
    return;
  }

  const userInfo = jwtDecode(token);
  const userId = userInfo.userId;

  try {
    // -------------------------------
    // 1️⃣ Get Evaluator Task List
    // -------------------------------
    const allTaskRes = await axios.get(
      `${process.env.REACT_APP_API_URL}/api/tasks/getall/tasks/${userId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    );

    const taskList = Array.isArray(allTaskRes.data)
      ? allTaskRes.data
      : allTaskRes.data?.tasks || allTaskRes.data?.data || [];

    const task = taskList.find((t) => String(t._id) === String(taskId));

    if (!task) {
      console.error("❌ Task Not Found");
      return;
    }

    const type = task.taskType?.toLowerCase().trim();

    console.log("🧠 Submit API TaskType:", type);

    let response;

    // -------------------------------
    // 2️⃣ Route Submit API
    // -------------------------------
    if (type === "question" || type === "questions") {
      response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/tasks/completedbooklet/${answerPdfId}/${userId}`,
        {
          submitted: timeTakenInMinutes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else if (type === "booklet") {
      response = await axios.put(
        `${process.env.REACT_APP_API_URL}/api/booklet-tasks/complete/${answerPdfId}/${userId}`,
        {
          submitted: timeTakenInMinutes,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
    } else {
      console.error("❌ Unknown taskType:", type);
      return;
    }

    return response.data;
  } catch (error) {
    console.error("🚨 Submit Resolver Error:", error);
    return error?.response?.data || error;
  }
};

export const submitImageById = async (formData) => {
  const token = localStorage.getItem("token");

  try {
    const response = await axios.post(
      `${process.env.REACT_APP_API_URL}/api/evaluation/answerimages/api/saveimages`,
      formData, // Include formData in the request body
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data", // Ensure the correct content type
        },
      }
    );
    return response.data; // return the full response to handle status outside
  } catch (error) {
    console.error(error);
    return error.response?.data || { error: "An error occurred" }; // Handle cases where error.response is undefined
  }
};
