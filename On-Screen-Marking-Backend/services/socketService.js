import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

import Task from "../models/taskModels/taskModel.js";

import User from "../models/authModels/User.js";
import BookletTask from "../models/taskModels/bookletTaskModel.js";

import Marks from "../models/EvaluationModels/marksModel.js";
import HeadMarks from "../models/EvaluationModels/headMarksModel.js";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseDataDir = path.join(__dirname, "../Annotations");
const bookletBaseDataDir = path.join(__dirname, "../BookletAnnotations");

// FIXED: Only use answerPdfId and page
export async function getFilePath(
  userId,
  answerPdfId,
  page,
  taskType = "question",
  evaluatorId = null,
) {
  console.log("🧩 getFilePath called with:", {
    userId,
    answerPdfId,
    page,
    baseDataDir,
    evaluatorId,
  });

  const userType = await User.findById(userId).select("role");
  console.log("User type for getFilePath:", userType?.role);

  const rootDir = taskType === "booklet" ? bookletBaseDataDir : baseDataDir;

  let pdfDir;

  if (userType?.role === "headevaluator") {
    // HEAD EVALUATOR CASE

    if (taskType === "booklet") {
      // booklet -> don't use userId
      pdfDir = path.join(
        String(rootDir),
        String(evaluatorId),
        String(answerPdfId),
      );
    } else if (taskType === "question") {
      // question -> use userId
      pdfDir = path.join(
        String(rootDir),
        String(evaluatorId), // ROOT (original evaluator)
        String(answerPdfId),
        String(userId), // CHILD (head evaluator)
      );
    }
  } else {
    // ✅ NORMAL EVALUATOR
    pdfDir = path.join(String(rootDir), String(userId), String(answerPdfId));
  }

  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  return path.join(pdfDir, `page_${String(page)}.json`);
}

export function getMarksDataFilePath(
  userId,
  answerPdfId,
  taskType = "question",
  evaluatorId = null,
) {
  // Create path: Annotations/answerPdfId/
  const rootDir = taskType === "booklet" ? bookletBaseDataDir : baseDataDir;

  const pdfDir = evaluatorId
    ? taskType === "booklet"
      ? path.join(String(rootDir), String(evaluatorId), String(answerPdfId))
      : path.join(
          String(rootDir),
          String(evaluatorId),
          String(answerPdfId),
          String(userId),
        )
    : path.join(String(rootDir), String(userId), String(answerPdfId));

  // Ensure directory exists
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  console.log("MARKS FILE TASK TYPE =", taskType);
  console.log("MARKS ROOT DIR =", rootDir);

  return path.join(pdfDir, `marksData.json`);
}

export function getMarksFilePath(
  userId,
  answerPdfId,
  taskType = "question",
  evaluatorId = null,
) {
  // Create path: Annotations/userId/answerPdfId/
  const rootDir = taskType === "booklet" ? bookletBaseDataDir : baseDataDir;

  const pdfDir = evaluatorId
    ? taskType === "booklet"
      ? path.join(String(rootDir), String(evaluatorId), String(answerPdfId))
      : path.join(
          String(rootDir),
          String(evaluatorId),
          String(answerPdfId),
          String(userId),
        )
    : path.join(String(rootDir), String(userId), String(answerPdfId));

  // Ensure directory exists
  if (!fs.existsSync(pdfDir)) {
    fs.mkdirSync(pdfDir, { recursive: true });
  }

  return path.join(pdfDir, `marks.json`);
}

export const getEvaluatorContext = async (taskId, userId) => {
  let task = await Task.findById(taskId);
  if (!task) {
    task = await BookletTask.findById(taskId);
  }
  if (!task) return { evaluatorId: null, isHead: false };

  const user = await mongoose.model("User").findById(userId).select("role");
  console.log("USER:", user);

  const role = user?.role?.toLowerCase();
  const isHead = role === "headevaluator";
  const isDeputyHead = role === "deputyhead";

  return {
    evaluatorId:
      isHead || isDeputyHead || role === "reviewer" ? task.evaluatorId : null,
    isHead,
  };
};

export const resetHeadMarksToZero = (
  userId,
  answerPdfId,
  evaluatorId,
  socket,
) => {
  try {
    // 🔹 marks.json
    const marksFile = loadMarks(userId, answerPdfId, evaluatorId, socket);

    if (marksFile.marks?.length > 0) {
      marksFile.marks = marksFile.marks.map((m) => ({
        ...m,
        allottedMarks: 0,
      }));

      saveMarks(userId, answerPdfId, marksFile, evaluatorId, socket);

      console.log("✅ Head marks.json reset to 0");
    }

    // 🔹 marksData.json
    const marksDataFile = loadMarksData(
      userId,
      answerPdfId,
      evaluatorId,
      socket,
    );

    if (marksDataFile.marks?.length > 0) {
      marksDataFile.marks = marksDataFile.marks.map((m) => ({
        ...m,
        allottedMarks: 0,
      }));

      saveMarksData(
        userId,
        answerPdfId,
        marksDataFile,
        evaluatorId,
        true,
        socket,
      );

      console.log("✅ Head marksData.json reset to 0");
    }
  } catch (err) {
    console.error("❌ Error resetting head marks:", err);
  }
};

export const validateHeadAccess = (userId, evaluatorId) => {
  // ❌ HEAD trying to write evaluator folder
  if (evaluatorId && String(userId) === String(evaluatorId)) {
    throw new Error("❌ Head evaluator cannot modify evaluator files");
  }
};

// ✅ Helper functions
export const loadData = async (
  userId,
  answerPdfId,
  page,
  evaluatorId,
  socket,
) => {
  if (answerPdfId === null || answerPdfId === undefined) {
    return { annotations: [], comments: [] };
  }
  const filePath = await getFilePath(
    userId,
    answerPdfId,
    page,
    socket.taskType,
    evaluatorId,
  );
  console.log("LOGGING THE PATH ", filePath);
  // console.log('LOGGING THE FILEDATA ', JSON.parse(fs.readFileSync(filePath, "utf-8")))
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      console.error("Error loading data:", error);
      return { annotations: [], comments: [] };
    }
  }
  return { annotations: [], comments: [] };
};

export const loadMarksData = (userId, answerPdfId, evaluatorId, socket) => {
  const filePath = getMarksDataFilePath(
    userId,
    answerPdfId,
    socket.taskType,
    evaluatorId,
  );
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      console.error("Error loading data:", error);
      return { marks: [] };
    }
  }
  return { marks: [] };
};
export const loadMarks = (userId, answerPdfId, evaluatorId, socket) => {
  const filePath = getMarksFilePath(
    userId,
    answerPdfId,
    socket.taskType,
    evaluatorId,
  );
  if (fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch (error) {
      console.error("Error loading data:", error);
      return { marks: [] };
    }
  }
  return { marks: [] };
};

export const saveData = async (
  taskId,
  userId,
  answerPdfId,
  page,
  data,
  evaluatorId,
  socket,
) => {
  try {
    // BLOCK INVALID ACCESS
    validateHeadAccess(userId, evaluatorId);
    const filePath = await getFilePath(
      userId,
      answerPdfId,
      page,
      socket.taskType,
      evaluatorId,
    );
    await fs.promises.writeFile(filePath, JSON.stringify(data, null, 2));
    console.log(
      `✅ Data saved for task ${taskId}, ${answerPdfId}, page ${page}`,
    );
  } catch (error) {
    console.error("Error saving data:", error);
  }
};

export const saveMarksData = (
  userId,
  answerPdfId,
  data,
  evaluatorId,
  isHead = false,
  socket,
) => {
  try {
    console.log("DATA FOR MARKSDATA.JSON ", data);
    validateHeadAccess(userId, evaluatorId);
    const filePath = getMarksDataFilePath(
      userId,
      answerPdfId,
      socket.taskType,
      evaluatorId,
    );

    console.log("🚨 FORCE SAVING DATA");
    console.log(
      "Question 1 allottedMarks:",
      data.marks.find((m) => m.questionsName === "1")?.allottedMarks,
    );

    // 🔥 HEAD CASE → ALWAYS OVERWRITE FILE
    data.lastSaved = new Date().toISOString();

    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    data.lastSaved = new Date().toISOString();

    // Method 1: Force sync write
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    fs.fsyncSync(fs.openSync(filePath, "r+")); // Force OS to flush to disk

    console.log("✅ FILE FORCE SAVED");

    // Immediate verification
    const saved = JSON.parse(fs.readFileSync(filePath, "utf8"));
    console.log(
      "✅ VERIFIED - Saved Question 1 allottedMarks:",
      saved.marks.find((m) => m.questionsName === "1")?.allottedMarks,
    );
  } catch (error) {
    console.error("❌ SAVE ERROR:", error);
  }
};

export const saveMarks = (userId, answerPdfId, data, evaluatorId, socket) => {
  try {
    validateHeadAccess(userId, evaluatorId);
    const filePath = getMarksFilePath(
      userId,
      answerPdfId,
      socket.taskType,
      evaluatorId,
    );
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    console.log(`✅ marks saved for answerPdfId ${answerPdfId}`);
  } catch (error) {
    console.error("Error saving data:", error);
  }
};
