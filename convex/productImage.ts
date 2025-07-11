import { getAuthUserId } from "@convex-dev/auth/server";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const getProductImages = query({
    args: {
      campaignId: v.id("campaigns"),
    },
    handler: async (ctx, args) => {
      const productImages = await ctx.db
        .query("productImages")
        .withIndex("by_campaign", (q) => q.eq("campaignId", args.campaignId))
        .collect();
  
      // Map each product image to include the URL
      return await Promise.all(
        productImages.map(async (img) => ({
          ...img,
          url: await ctx.storage.getUrl(img.productImageId),
        }))
      );
    },
  });

export const saveProductImage=mutation({
    args:{
        campaignId: v.id("campaigns"),
        productImageId: v.id("_storage"),
        isPrimary:v.boolean()

    },
    handler:async(ctx,args)=>{
        await ctx.db.insert("productImages",{
            campaignId:args.campaignId,
            productImageId:args.productImageId,
            isPrimary:args.isPrimary
        })
    }
})
export const updateProductImage = mutation({
    args: {
      imageId: v.id("productImages"),
      editedImageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
      // Update the existing product image with the new edited version
      await ctx.db.patch(args.imageId, {
        productImageId: args.editedImageId,
      });
      
      return { success: true };
    },
  });
  
  // If you also need to get the URL for the updated image, you can add this helper:
  export const getProductImageUrl = mutation({
    args: {
      storageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
      return await ctx.storage.getUrl(args.storageId);
    },
  });
  export const generateUploadUrl = mutation({
    handler: async (ctx) => {
      const userId = await getAuthUserId(ctx);
      if (!userId) {
        throw new Error("Not authenticated");
      }
      return await ctx.storage.generateUploadUrl();
    },
  });