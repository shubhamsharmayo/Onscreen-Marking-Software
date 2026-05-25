import { Worker } from "bullmq";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import bullRedis from "../services/bullRedis.js";

// import { loadData } from "../socket/annotationSocket.js";

// import { saveData } from "../socket/annotationSocket.js";
import mongoose from "mongoose";
import User from "../models/authModels/User.js";
import BookletTask from "../models/taskModels/bookletTaskModel.js";
import Task from "../models/taskModels/taskModel.js";

import dns from "dns";



import {
  getFilePath,
  getMarksDataFilePath,
  getMarksFilePath,
  getEvaluatorContext,
  resetHeadMarksToZero,
  validateHeadAccess,
  loadData,
  loadMarksData,
  loadMarks,
  saveData,
  saveMarksData,
  saveMarks,
} from "../services/socketService.js";




dns.setDefaultResultOrder("ipv4first");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

import dotenv from "dotenv";
dotenv.config();

await mongoose.connect(process.env.MONGO_URL);

console.log("✅ Worker Mongo Connected");

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const baseDataDir = path.join(__dirname, "../Annotations");
// const bookletBaseDataDir = path.join(__dirname, "../BookletAnnotations");


// export async function getFilePath(
//   userId,
//   answerPdfId,
//   page,
//   taskType = "question",
//   evaluatorId = null,
// ) {
//   // console.log("🧩 getFilePath called with:", {
//   //   userId,
//   //   answerPdfId,
//   //   page,
//   //   baseDataDir,
//   //   evaluatorId,
//   // });

//   const userType = await User.findById(userId).select("role");
//   // console.log("User type for getFilePath:", userType?.role);

//   const rootDir = taskType === "booklet" ? bookletBaseDataDir : baseDataDir;

//   let pdfDir;

//   if (userType?.role === "headevaluator") {
//     // HEAD EVALUATOR CASE

//     if (taskType === "booklet") {
//       // booklet -> don't use userId
//       pdfDir = path.join(
//         String(rootDir),
//         String(evaluatorId),
//         String(answerPdfId),
//       );
//     } else if (taskType === "question") {
//       // question -> use userId
//       pdfDir = path.join(
//         String(rootDir),
//         String(evaluatorId), // ROOT (original evaluator)
//         String(answerPdfId),
//         String(userId), // CHILD (head evaluator)
//       );
//     }
//   } else {
//     // ✅ NORMAL EVALUATOR
//     pdfDir = path.join(String(rootDir), String(userId), String(answerPdfId));
//   }

//   if (!fs.existsSync(pdfDir)) {
//     fs.mkdirSync(pdfDir, { recursive: true });
//   }

//   return path.join(pdfDir, `page_${String(page)}.json`);
// }


// const validateHeadAccess = (userId, evaluatorId) => {
//   // ❌ HEAD trying to write evaluator folder
//   if (evaluatorId && String(userId) === String(evaluatorId)) {
//     throw new Error("❌ Head evaluator cannot modify evaluator files");
//   }
// };

// // import { getEvaluatorContext } from "../socket/annotationSocket.js";

// export const getEvaluatorContext = async (taskId, userId) => {
//   let task = await Task.findById(taskId);
//   if (!task) {
//     task = await BookletTask.findById(taskId);
//   }
//   if (!task) return { evaluatorId: null, isHead: false };

//   const user = await mongoose.model("User").findById(userId).select("role");
//   // console.log("USER:", user);

//   const role = user?.role?.toLowerCase();
//   const isHead = role === "headevaluator";
//   const isDeputyHead = role === "deputyhead";

//   return {
//     evaluatorId:
//       isHead || isDeputyHead || role === "reviewer" ? task.evaluatorId : null,
//     isHead,
//   };
// };



// export const saveData = async (
//   taskId,
//   userId,
//   answerPdfId,
//   page,
//   data,
//   evaluatorId,
//   socket,
// ) => {
//   try {
//     // BLOCK INVALID ACCESS
//     validateHeadAccess(userId, evaluatorId);
//     const filePath = await getFilePath(
//       userId,
//       answerPdfId,
//       page,
//       socket.taskType,
//       evaluatorId,
//     );
//     await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
//     console.log(
//       `✅ Data saved for task ${taskId}, ${answerPdfId}, page ${page}`,
//     );
//   } catch (error) {
//     console.error("Error saving data:", error);
//   }
// };



// export const loadData = async (
//   userId,
//   answerPdfId,
//   page,
//   evaluatorId,
//   socket,
// ) => {
//   if (answerPdfId === null || answerPdfId === undefined) {
//     return { annotations: [], comments: [] };
//   }
//   const filePath = await getFilePath(
//     userId,
//     answerPdfId,
//     page,
//     socket.taskType,
//     evaluatorId,
//   );
//   console.log("LOGGING THE PATH ", filePath);
//   // console.log('LOGGING THE FILEDATA ', JSON.parse(fs.readFileSync(filePath, "utf-8")))
//   if (fs.existsSync(filePath)) {
//     try {
//       return JSON.parse(fs.readFileSync(filePath, "utf-8"));
//     } catch (error) {
//       console.error("Error loading data:", error);
//       return { annotations: [], comments: [] };
//     }
//   }
//   return { annotations: [], comments: [] };
// };


const worker = new Worker(
  "annotationQueue",

  async (job) => {
    try {
      const { data, socket } = job.data;

      const { taskId, answerPdfId, userId, page } = data;

      console.log(`📝 Processing annotation page ${page}`);

      const { evaluatorId } = await getEvaluatorContext(taskId, userId);

      // IMPORTANT:
      // load inside worker

      const fileData = await loadData(
        userId,
        answerPdfId,
        page,
        evaluatorId,
        socket,
      );

      // console.log(fileData);

      const annotationObject = {
        id: data.timeStamps,

        taskId: data.taskId,

        page: data.page,

        answerPdfImageId: data.answerPdfImageId,

        answerPdfId: data.answerPdfId,

        userId: data.userId,

        questionDefinitionId: data.questionDefinitionId,

        iconUrl: data.iconUrl,

        question: data.question,

        timeStamps: data.timeStamps,

        x: data.x,

        y: data.y,

        width: data.width,

        height: data.height,

        synced: data.synced !== undefined ? data.synced : false,

        mark: data.mark || 0,

        parentQuestionId: data.parentQuestionId,

        email: data.email,

        role: data.role,
      };


      console.log("Annotation object to save:", annotationObject);

      const existingIndex = fileData.annotations.findIndex(
        (ann) => ann.id === data.timeStamps,
      );

      console.log("Existing annotation index:", existingIndex);

      if (existingIndex !== -1) {
        fileData.annotations[existingIndex] = {
          ...fileData.annotations[existingIndex],

          ...annotationObject,
        };

        console.log("✅ Updated existing annotation");
      } else {
        fileData.annotations.push(annotationObject);

        console.log("✅ Added new annotation");
      }

      await saveData(
        taskId,
        userId,
        answerPdfId,
        page,
        fileData,
        evaluatorId,
        socket,
      );

      console.log(`✅ Saved page ${page}`);

      console.log("WORKER PID:", process.pid);
    } catch (error) {
      console.error("❌ Worker Error:", error);

      throw error;
    }
  },

  {
    connection: bullRedis,

    // IMPORTANT
    concurrency: 1,
  },
);

worker.on("completed", (job) => {
  console.log(`✅ Job ${job.id} completed`);
});

worker.on("failed", (job, err) => {
  console.log(`❌ Job ${job?.id} failed`);

  console.error(err);
});
