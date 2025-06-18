import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  threads: defineTable({
    userId: v.string(),
    title: v.string(),
    model: v.optional(v.string()),
    interface: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  messages: defineTable({
    chatId: v.string(),
    role: v.union(v.literal("user"), v.literal("assistant")),
    content: v.string(),
    model: v.optional(v.string()),
    isAI: v.optional(v.boolean()),
    isComplete: v.optional(v.boolean()),
    timestamp: v.optional(v.number()),
    userId: v.optional(v.string()),
    threadId: v.optional(v.id("threads")),
  })
    .index("by_chat", ["chatId"])
    .index("by_thread", ["threadId"]),

  userPreferences: defineTable({
    userId: v.string(),
    defaultModel: v.string(),
    defaultInterface: v.string(),
  }).index("by_user", ["userId"]),
});
