import type { NextFunction, Request, Response } from "express";

type Bucket = { count: number; resetAt: number };

export function rateLimit(options: { windowMs: number; max: number; keyPrefix: string }) {
  const buckets = new Map<string, Bucket>();
  const cleanup = setInterval(() => {
    const now = Date.now();
    for (const [key, bucket] of buckets) if (bucket.resetAt <= now) buckets.delete(key);
  }, Math.min(options.windowMs, 60_000));
  cleanup.unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = `${options.keyPrefix}:${req.ip ?? req.socket.remoteAddress ?? "unknown"}`;
    const now = Date.now();
    const current = buckets.get(key);
    const bucket = !current || current.resetAt <= now ? { count: 0, resetAt: now + options.windowMs } : current;
    bucket.count += 1;
    buckets.set(key, bucket);
    res.setHeader("RateLimit-Limit", options.max);
    res.setHeader("RateLimit-Remaining", Math.max(0, options.max - bucket.count));
    res.setHeader("RateLimit-Reset", Math.ceil(bucket.resetAt / 1000));
    if (bucket.count > options.max) return res.status(429).json({ message: "Too many requests. Please try again later." });
    return next();
  };
}
