import { useState } from "react";
import { ImageUpload } from "./ImageUpload";
import { ImagePromptInput } from "./ImagePromptInput";
import { ImageResultDisplay } from "./ImageResultDisplay";
import { useAction, useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { HistoryItem } from "../../lib/type"
import { ImageIcon, Wand2 } from "lucide-react"

interface AiImageProps {
    campaignId: string | null;
  }

export function AiImage({campaignId}:AiImageProps){
    const [image, setImage] = useState<string | null>(null);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [description, setDescription] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [history, setHistory] = useState<HistoryItem[]>([]);
  
    const handleImageSelect = (imageData: string) => {
      setImage(imageData || null);
    };
  
    const generateImage = useAction(api.gemini.generateImage);
    
    const handlePromptSubmit = async (prompt: string) => {
      try {
        setLoading(true);
        setError(null);
  
        // If we have a generated image, use that for editing, otherwise use the uploaded image
        const imageToEdit = generatedImage || image;
  
        const result = await generateImage({
          prompt,
          image: imageToEdit || undefined,
          history: history.length > 0 ? history : undefined,
        });
  
        if (result.success && result.image) {
          // Update the generated image and description
          setGeneratedImage(result.image);
          setDescription(result.description || null);
  
          // Update history locally - add user message
          const userMessage: HistoryItem = {
            role: "user",
            parts: [
              { text: prompt },
              ...(imageToEdit ? [{ image: imageToEdit }] : []),
            ],
          };
  
          // Add AI response
          const aiResponse: HistoryItem = {
            role: "model",
            parts: [
              ...(result.description ? [{ text: result.description }] : []),
              ...(result.image ? [{ image: result.image }] : []),
            ],
          };
  
          // Update history with both messages
          setHistory((prevHistory) => [...prevHistory, userMessage, aiResponse]);
        } else {
          setError("No image returned from API");
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : "An error occurred");
        console.error("Error processing request:", error);
      } finally {
        setLoading(false);
      }
    };
  
    const handleReset = () => {
      setImage(null);
      setGeneratedImage(null);
      setDescription(null);
      setLoading(false);
      setError(null);
      setHistory([]);
    };
  
    // If we have a generated image, we want to edit it next time
    const currentImage = generatedImage || image;
    const isEditing = !!currentImage;
  
    // Get the latest image to display (always the generated image)
    const displayImage = generatedImage;
    const productImages = useQuery(api.productImage.getProductImages, 
        campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip"
      );
    const updateProductImage = useMutation(api.productImage.updateProductImage);
    const generateUploadUrl = useMutation(api.productImage.generateUploadUrl);
    const createProductImage = useMutation(api.productImage.saveProductImage);

    return (
        <main className="min-h-screen bg-background p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto">
            <Card className="w-full border-0 bg-card shadow-none">
              <CardHeader className="flex flex-col items-center justify-center space-y-2 px-4 sm:px-6">
                <CardTitle className="flex items-center gap-2 text-foreground text-xl sm:text-2xl">
                  <Wand2 className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                  <span className="text-center">Image Creation & Editing</span>
                </CardTitle>
                <span className="text-xs sm:text-sm font-mono text-muted-foreground text-center">
                  powered by Google DeepMind Gemini 2.0 Flash
                </span>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 pt-4 sm:pt-6 w-full px-4 sm:px-6">
            {error && (
              <div className="p-4 mb-4 text-sm text-red-700 bg-red-100 rounded-lg">
                {error}
              </div>
            )}
  
            {!displayImage && !loading ? (
              <>
                <ImageUpload
                  onImageSelect={handleImageSelect}
                  currentImage={currentImage}
                />
                <ImagePromptInput
                  onSubmit={(prompt: string) => {
                    void handlePromptSubmit(prompt);
                  }}
                  isEditing={isEditing}
                  isLoading={loading}
                />
              </>
            ) : loading ? (
              <div
                role="status"
                className="flex items-center mx-auto justify-center h-56 max-w-sm bg-gray-300 rounded-lg animate-pulse dark:bg-secondary"
              >
                <ImageIcon className="w-10 h-10 text-gray-200 dark:text-muted-foreground" />
                <span className="pl-4 font-mono font-xs text-muted-foreground">
                  Processing...
                </span>
              </div>
            ) : (
              <>
                <ImageResultDisplay
                  imageUrl={displayImage || ""}
                  description={description}
                  onReset={handleReset}
                  conversationHistory={history}
                />
                <ImagePromptInput
                  onSubmit={(prompt: string) => {
                    void handlePromptSubmit(prompt);
                  }}
                  isEditing={true}
                  isLoading={loading}
                />
              </>
            )}
              </CardContent>
            </Card>
          </div>
        </main>
    )
}