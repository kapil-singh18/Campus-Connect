import rateLimit from "express-rate-limit";

const fifteenMinutes = 15 * 60 * 1000;

const rateLimitOptions = {
    windowMs: fifteenMinutes,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        message: "Too many requests. Please try again later.",
    },
};

export const apiRateLimiter = rateLimit({
    ...rateLimitOptions,
    limit: 300,
});

export const authRateLimiter = rateLimit({
    ...rateLimitOptions,
    limit: 20,
});

export const chatbotRateLimiter = rateLimit({
    ...rateLimitOptions,
    limit: 30,
});