import IORedis from "ioredis";

const bullRedis = new IORedis({
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: process.env.REDIS_PORT || 6379,

  maxRetriesPerRequest: null,
});

bullRedis.on("connect", () => {
  console.log("✅ BullMQ Redis Connected");
});

bullRedis.on("error", (err) => {
  console.log(
    "❌ BullMQ Redis Error:",
    err.message
  );
});

export default bullRedis;