import { afterAll, describe, expect, it } from "vitest";
import mongoose from "mongoose";

describe("TaskFlow backend secrets", () => {
  it("connects to the configured MongoDB instance", async () => {
    const uri = process.env.MONGODB_URI;
    expect(uri, "MONGODB_URI must be configured").toBeTruthy();

    await mongoose.connect(uri as string, { serverSelectionTimeoutMS: 5000 });
    const result = await mongoose.connection.db?.command({ ping: 1 });
    expect(result?.ok).toBe(1);
  }, 10000);

  afterAll(async () => {
    await mongoose.disconnect();
  });
});
