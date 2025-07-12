import { mutation } from "./_generated/server";
import { v } from "convex/values";
import { GoogleGenAI } from "@google/genai";
import { action } from "./_generated/server";

// Define the model ID for Gemini 2.0 Flash experimental
const MODEL_ID = "gemini-2.0-flash-exp-image-generation";

// Define interface for the formatted history item
interface FormattedHistoryItem {
  role: "user" | "model";
  parts: Array<{
    text?: string;
    inlineData?: { data: string; mimeType: string };
  }>;
}

interface HistoryItem {
  role: "user" | "model";
  parts: HistoryPart[];
}

interface HistoryPart {
  text?: string;
  image?: string;
}

export const generateImage = action({
  args: {
    prompt: v.string(),
    image: v.optional(v.string()),
    history: v.optional(v.array(v.object({
      role: v.union(v.literal("user"), v.literal("model")),
      parts: v.array(v.object({
        text: v.optional(v.string()),
        image: v.optional(v.string())
      }))
    })))
  },
  handler: async (ctx, args) => {
    const { prompt, image: inputImage, history } = args;

    // Get the API key from environment variables
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    
    if (!GEMINI_API_KEY) {
      console.error("GEMINI_API_KEY is not configured");
      throw new Error("GEMINI_API_KEY is not configured");
    }

    // Initialize the Google Gen AI client
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    // Validate the image if provided
    if (inputImage) {
      if (typeof inputImage !== "string" || !inputImage.startsWith("data:")) {
        console.error("Invalid image data URL format", { inputImage });
        throw new Error("Invalid image data URL format");
      }
      const imageParts = inputImage.split(",");
      if (imageParts.length < 2) {
        console.error("Malformed image data URL", { inputImage });
        throw new Error("Malformed image data URL");
      }
      const base64Image = imageParts[1];
      // Check for non-empty and valid base64 (basic check)
      if (!base64Image || !/^([A-Za-z0-9+/=]+)$/.test(base64Image.replace(/\s/g, ""))) {
        console.error("Image data is empty or not valid base64", { base64Image });
        throw new Error("Image data is empty or not valid base64");
      }
    }

    try {
      // Convert history to the format expected by Gemini API
      const formattedHistory =
        history && history.length > 0
          ? history
              .map((item: HistoryItem) => {
                return {
                  role: item.role,
                  parts: item.parts
                    .map((part: HistoryPart) => {
                      if (part.text) {
                        return { text: part.text };
                      }
                      if (part.image && item.role === "user") {
                        const imgParts = part.image.split(",");
                        if (imgParts.length > 1) {
                          return {
                            inlineData: {
                              data: imgParts[1],
                              mimeType: part.image.includes("image/png")
                                ? "image/png"
                                : "image/jpeg",
                            },
                          };
                        }
                      }
                      return { text: "" };
                    })
                    .filter((part) => Object.keys(part).length > 0), // Remove empty parts
                };
              })
              .filter((item: FormattedHistoryItem) => item.parts.length > 0) // Remove items with no parts
          : [];

      // Prepare the current message parts
      const messageParts = [];

      // Add the text prompt
      messageParts.push({ text: prompt });

      // Add the image if provided
      if (inputImage) {
        // For image editing
        console.log("Processing image edit request");

        // Check if the image is a valid data URL
        if (!inputImage.startsWith("data:")) {
          throw new Error("Invalid image data URL format");
        }

        const imageParts = inputImage.split(",");
        if (imageParts.length < 2) {
          throw new Error("Invalid image data URL format");
        }

        const base64Image = imageParts[1];
        const mimeType = inputImage.includes("image/png")
          ? "image/png"
          : "image/jpeg";
        console.log(
          "Base64 image length:",
          base64Image.length,
          "MIME type:",
          mimeType
        );

        // Add the image to message parts
        messageParts.push({
          inlineData: {
            data: base64Image,
            mimeType: mimeType,
          },
        });
      }
      
      // Add the message parts to the history
      formattedHistory.push({
        role: "user",
        parts: messageParts
      });

      // Generate the content
      const response = await ai.models.generateContent({
        model: MODEL_ID,
        contents: formattedHistory,
        config: {
          temperature: 1,
          topP: 0.95,
          topK: 40,
          responseModalities: ["Text", "Image"],
        },
      });

      let textResponse: string | null = null;
      let imageData: string | null = null;
      let mimeType = "image/png";

      // Process the response
      if (response.candidates && response.candidates.length > 0) {
        const candidate = response.candidates[0];
        const parts = candidate?.content?.parts;
        
        if (!parts) {
          throw new Error("No content parts in Gemini response");
        }
        
        console.log("Number of parts in response:", parts.length);

        for (const part of parts) {
          if ("inlineData" in part && part.inlineData) {
            // Get the image data
            imageData = part.inlineData.data || null;
            mimeType = part.inlineData.mimeType || "image/png";
            console.log(
              "Image data received, length:",
              imageData?.length || 0,
              "MIME type:",
              mimeType
            );
          } else if ("text" in part && part.text) {
            // Store the text
            textResponse = part.text;
            console.log(
              "Text response received:",
              textResponse.substring(0, 50) + "..."
            );
          }
        }
      } else {
        console.error("No response from Gemini API", { response });
        throw new Error("No response from Gemini API");
      }

      if (!imageData) {
        console.error("No image data in Gemini response", { response });
        throw new Error("No image data in Gemini response");
      }

      // Return the base64 image and description
      return {
        success: true,
        image: `data:${mimeType};base64,${imageData}`,
        description: textResponse || null
      };
    } catch (error) {
      console.error("Error in AI processing:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error in AI processing";
      throw new Error(`Gemini API error: ${errorMessage}`);
    }
  },
});