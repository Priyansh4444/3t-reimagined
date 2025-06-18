import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    userId: v.string(),
    title: v.string(),
    model: v.string(),
    interface: v.string(),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_creation_time", ["userId", "_creationTime"]),

  messages: defineTable({
    threadId: v.id("threads"),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.string(),
  })
    .index("by_thread", ["threadId"])
    .index("by_thread_and_creation_time", ["threadId", "_creationTime"]),

  userPreferences: defineTable({
    userId: v.string(),
    defaultModel: v.string(),
    defaultInterface: v.string(),
  }).index("by_user", ["userId"]),
});
