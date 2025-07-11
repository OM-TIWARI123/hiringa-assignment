import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const applicationTables = {
  companies: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()), // Make optional for migration
    websiteUrl: v.optional(v.string()),
    description: v.optional(v.string()),
    logoFileId: v.optional(v.id("_storage")),
    assetsFileIds: v.optional(v.array(v.id("_storage"))),
  }).index("by_user", ["userId"]),

  campaigns: defineTable({
    userId: v.id("users"),
    name: v.optional(v.string()),
    companyId: v.id("companies"),
    //productImageId: v.optional(v.id("_storage")),
    layoutImageId: v.optional(v.id("_storage")),
    instructions: v.optional(v.string()),
    productDescription: v.optional(v.string()),
    status: v.string(), // "draft" | "generated" | "completed"
    selectedPosts: v.optional(v.array(v.number())),
  }).index("by_user", ["userId"]),

  generatedPosts: defineTable({
    campaignId: v.id("campaigns"),
    posts: v.array(v.object({
      text: v.string(),
      editPrompt: v.optional(v.string()),
    })),
  }).index("by_campaign", ["campaignId"]),

  productImages: defineTable({
    campaignId: v.id("campaigns"),
    productImageId: v.id("_storage"),
    isPrimary: v.boolean(), // Each image has its own document and URL
  }).index("by_campaign", ["campaignId"])
    .index("by_campaign_and_primary",["campaignId","isPrimary"])
  
};

export default defineSchema({
  ...authTables,
  ...applicationTables,
});
