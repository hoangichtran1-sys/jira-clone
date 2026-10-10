import { Redis } from "ioredis";
import { env } from "./env";

// cau hinh production
// export const connection = new Redis(
//     env.REDIS_URL || "redis://127.0.0.1:6379",
//     {
//         maxRetriesPerRequest: null,
//         enableReadyCheck: false,
//     },
// );

// Định nghĩa kiểu cho biến global để tránh lỗi TypeScript
const globalForRedis = global as unknown as {
    redisConnection: Redis | undefined;
};

const redisUrl = env.REDIS_URL || "redis://127.0.0.1:6379";

// Kiểm tra nếu đã có kết nối trong global thì dùng lại, nếu chưa thì tạo mới
export const redis =
    globalForRedis.redisConnection ??
    new Redis(redisUrl, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        // Thêm cấu hình này để ioredis tự động đóng các kết nối treo
        keepAlive: 10000,
        db: 0,
    });

// Trong môi trường development, lưu kết nối vào biến global
if (env.NODE_ENV !== "production") {
    globalForRedis.redisConnection = redis;
}

redis.on("error", (err) => console.error("Redis Connection Error:", err));

// Chỉ log khi thực sự tạo kết nối mới thành công
redis.once("connect", () => {
    console.log("✅ Redis connected successfully!");
});
