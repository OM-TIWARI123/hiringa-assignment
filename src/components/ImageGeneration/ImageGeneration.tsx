import { useState, useEffect } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";

interface ImageGenerationProps {
  campaignId: string;
}

export function ImageGeneration({ campaignId }: ImageGenerationProps) {
  const [selectedImages, setSelectedImages] = useState<number[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Convex functions
  const createProductImage = useMutation(api.productImage.saveProductImage);

  // Dummy AI-generated images for now
  const aiGeneratedImages = [
    "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1556742044-3c52d6e88c62?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1556742045-0cfed4f6a45d?w=500&h=500&fit=crop",
    "https://images.unsplash.com/photo-1556742046-0cfed4f6a45d?w=500&h=500&fit=crop",
  ];

  // Simulate loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  const handleSelectImage = (index: number) => {
    setSelectedImages((prev) =>
      prev.includes(index)
        ? prev.filter((i) => i !== index)
        : [...prev, index]
    );
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setIsTransitioning(true);
      setCurrentImageIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNextImage = () => {
    if (currentImageIndex < aiGeneratedImages.length - 1) {
      setIsTransitioning(true);
      setCurrentImageIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleSaveSelectedImages = async () => {
    if (selectedImages.length === 0) {
      toast.error("Please select at least one image");
      return;
    }

    setIsSaving(true);
    try {
      // Save selected images to productImages table
      for (const imageIndex of selectedImages) {
        const imageUrl = aiGeneratedImages[imageIndex];
        // For now, we'll just show a success message
        // Later this will save to the actual database
        console.log(`Saving image ${imageIndex + 1} to campaign ${campaignId}`);
      }
      
      toast.success(`${selectedImages.length} images saved successfully!`);
      setSelectedImages([]);
    } catch (error) {
      console.error("Error saving images:", error);
      toast.error("Failed to save images");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        <p className="text-lg font-medium text-gray-600">Generating AI images...</p>
        <p className="text-sm text-gray-500">This may take a few moments</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 sm:mb-8 gap-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-center sm:text-left">AI Generated Images</h1>
          <div className="text-sm text-gray-500">
            {aiGeneratedImages.length > 0 ? `${currentImageIndex + 1} of ${aiGeneratedImages.length}` : 'No images'}
          </div>
        </div>

        <div className="relative px-4 sm:px-12">
          {/* Previous button */}
          <button
            onClick={handlePrevImage}
            disabled={currentImageIndex === 0}
            className="absolute left-0 top-1/2 transform -translate-y-1/2 z-10
              w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg flex items-center justify-center
              text-gray-600 hover:text-indigo-600 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Next button */}
          <button
            onClick={handleNextImage}
            disabled={currentImageIndex >= aiGeneratedImages.length - 1}
            className="absolute right-0 top-1/2 transform -translate-y-1/2 z-10
              w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white shadow-lg flex items-center justify-center
              text-gray-600 hover:text-indigo-600 transition-colors
              disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-4 h-4 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {/* Single image display */}
          <div className={`transition-opacity duration-300 ${isTransitioning ? 'opacity-0' : 'opacity-100'}`}>
            {aiGeneratedImages[currentImageIndex] && (
              <div className="relative rounded-lg overflow-hidden border-2 aspect-square transition-all max-w-md mx-auto border-gray-200">
                <img 
                  src={aiGeneratedImages[currentImageIndex]} 
                  alt={`AI Generated Image ${currentImageIndex + 1}`} 
                  className="w-full h-full object-cover"
                />
                
                {/* Selection indicator */}
                {selectedImages.includes(currentImageIndex) && (
                  <div className="absolute top-0 right-0 w-0 h-0 border-t-[2rem] sm:border-t-[3rem] border-r-[2rem] sm:border-r-[3rem] border-green-500 border-l-transparent border-b-transparent">
                    <svg
                      className="absolute top-[-1.5rem] sm:top-[-2.5rem] right-[-1.5rem] sm:right-[-2.5rem] w-4 h-4 sm:w-5 sm:h-5 text-white transform rotate-45"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}

                {/* Select button */}
                <button
                  onClick={() => handleSelectImage(currentImageIndex)}
                  className={`absolute top-2 right-2 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium transition-colors
                    ${selectedImages.includes(currentImageIndex)
                      ? 'text-green-700 bg-green-100 hover:bg-green-200'
                      : 'text-gray-600 bg-gray-100 hover:bg-gray-200'}`}
                >
                  {selectedImages.includes(currentImageIndex) ? 'Selected' : 'Select'}
                </button>

                {/* Download button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const link = document.createElement("a");
                    link.href = aiGeneratedImages[currentImageIndex];
                    link.download = `ai-generated-image-${currentImageIndex + 1}-${Date.now()}.png`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  className="absolute top-2 left-2 px-2 py-1 bg-white/90 hover:bg-white text-gray-700 rounded-md shadow-sm transition-colors text-xs font-medium"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Save Selected Images Button */}
        <div className="sticky bottom-4 sm:bottom-8 flex justify-center px-4 mt-6">
          <button
            onClick={() => {
              void handleSaveSelectedImages();
            }}
            disabled={selectedImages.length === 0 || isSaving}
            className="px-4 sm:px-8 py-3 sm:py-4 bg-indigo-600 text-white rounded-lg font-medium shadow-lg
              hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-colors duration-200 text-sm sm:text-base w-full sm:w-auto"
          >
            {isSaving ? (
              <span className="flex items-center justify-center sm:justify-start">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : (
              `Save ${selectedImages.length} Selected Images`
            )}
          </button>
        </div>
      </div>
    </div>
  );
} 