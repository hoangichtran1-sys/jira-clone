import arcjet, {
    detectBot,
    shield,
    slidingWindow,
    tokenBucket,
} from "@arcjet/next";

const arcjetKey = process.env.ARCJET_KEY!;
const arcjetMode = process.env.ARCJECT_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

export const baseArcjet = arcjetKey
    ? arcjet({
          key: arcjetKey,
          rules: [
              shield({ mode: arcjetMode }),
              detectBot({
                  mode: arcjetMode,
                  allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
              }),
              slidingWindow({
                  mode: arcjetMode,
                  characteristics: ["ip.src"],
                  interval: "60s",
                  max: 300,
              }),
          ],
      })
    : null;

export const authArcjet = arcjetKey
    ? arcjet({
          key: arcjetKey,
          rules: [
              shield({ mode: arcjetMode }),
              detectBot({
                  mode: arcjetMode,
                  allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
              }),
              tokenBucket({
                  mode: arcjetMode,
                  characteristics: ["ip.src"],
                  refillRate: 5, // Refill 5 tokens per interval
                  interval: 300, // Refill every 600 seconds
                  capacity: 25, // Bucket capacity of 25 tokens
              }),
          ],
      })
    : null;

export const sessionArcjet = arcjetKey
    ? arcjet({
          key: arcjetKey,
          rules: [
              shield({ mode: arcjetMode }),
              detectBot({
                  mode: arcjetMode,
                  allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
              }),
              slidingWindow({
                  mode: arcjetMode,
                  characteristics: ["ip.src", "user.id"],
                  interval: "60s",
                  max: 180,
              }),
          ],
      })
    : null;