import { Queue } from "bullmq";
import bullRedis from "./bullRedis.js";

const annotationQueue = new Queue(
  "annotationQueue",
  {
    connection: bullRedis,
  }
);

export default annotationQueue;