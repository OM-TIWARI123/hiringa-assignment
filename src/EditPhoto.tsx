import React, { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { InPaintingEditor } from "./Inpainter";

interface EditPhotoProps {
  campaignId: string | null;
}

type EditMode = 'basic' | 'inpainting';

export function EditPhoto({ campaignId }: EditPhotoProps) {
  const [selectedImageId, setSelectedImageId] = useState<Id<"productImages"> | null>(null);
  const [editMode, setEditMode] = useState<EditMode>('basic');
  const [isEditing, setIsEditing] = useState(false);
  const [editedImageFile, setEditedImageFile] = useState<File | null>(null);
  const [originalImageData, setOriginalImageData] = useState<ImageData | null>(null);
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [saturation, setSaturation] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const productImages = useQuery(api.productImage.getProductImages, {
    campaignId: campaignId as Id<"campaigns">,
  });

  const updateProductImage = useMutation(api.productImage.updateProductImage);
  const generateUploadUrl = useMutation(api.productImage.generateUploadUrl);

  const handleImageSelect = (imageId: Id<"productImages">) => {
    const selectedImage = productImages?.find(img => img._id === imageId);
    if (selectedImage) {
      setSelectedImageId(imageId);
      setIsEditing(true);
      if (editMode === 'basic') {
        loadImageToCanvas(selectedImage.url || "");
      }
      resetFilters();
    }
  };

  const resetFilters = () => {
    setBrightness(0);
    setContrast(0);
    setSaturation(0);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setEditedImageFile(file);
      if (editMode === 'basic') {
        loadImageToCanvas(URL.createObjectURL(file));
      }
      resetFilters();
    }
  };

  const loadImageToCanvas = (imageSrc: string) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      // Set canvas size to maintain aspect ratio
      const maxWidth = 600;
      const maxHeight = 400;
      let { width, height } = img;

      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;
      ctx.drawImage(img, 0, 0, width, height);
      
      // Store original image data
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      setOriginalImageData(imageData);
    };
    img.src = imageSrc;
  };

  const applyFilters = () => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Start with original image data
    const imageData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );
    const data = imageData.data;

    // Apply brightness, contrast, and saturation
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];

      // Apply brightness
      r += brightness;
      g += brightness;
      b += brightness;

      // Apply contrast
      const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));
      r = contrastFactor * (r - 128) + 128;
      g = contrastFactor * (g - 128) + 128;
      b = contrastFactor * (b - 128) + 128;

      // Apply saturation
      const gray = 0.299 * r + 0.587 * g + 0.114 * b;
      const satFactor = saturation / 100;
      r = gray + satFactor * (r - gray);
      g = gray + satFactor * (g - gray);
      b = gray + satFactor * (b - gray);

      // Clamp values
      data[i] = Math.max(0, Math.min(255, r));
      data[i + 1] = Math.max(0, Math.min(255, g));
      data[i + 2] = Math.max(0, Math.min(255, b));
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const applyPresetFilter = (filterType: string) => {
    const canvas = canvasRef.current;
    if (!canvas || !originalImageData) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const imageData = new ImageData(
      new Uint8ClampedArray(originalImageData.data),
      originalImageData.width,
      originalImageData.height
    );
    const data = imageData.data;

    switch (filterType) {
      case "grayscale":
        for (let i = 0; i < data.length; i += 4) {
          const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
          data[i] = gray;
          data[i + 1] = gray;
          data[i + 2] = gray;
        }
        break;
      case "sepia":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
          data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
          data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
        break;
      case "invert":
        for (let i = 0; i < data.length; i += 4) {
          data[i] = 255 - data[i];
          data[i + 1] = 255 - data[i + 1];
          data[i + 2] = 255 - data[i + 2];
        }
        break;
      case "vintage":
        for (let i = 0; i < data.length; i += 4) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          data[i] = Math.min(255, r * 0.9 + 30);
          data[i + 1] = Math.min(255, g * 0.8 + 20);
          data[i + 2] = Math.min(255, b * 0.6 + 10);
        }
        break;
    }

    ctx.putImageData(imageData, 0, 0);
  };

  const resetToOriginal = () => {
    if (originalImageData && canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      if (ctx) {
        ctx.putImageData(originalImageData, 0, 0);
      }
    }
    resetFilters();
  };

  const saveEditedImageToDatabase = async (imageBlob?: Blob) => {
    if (!selectedImageId) return;

    setIsSaving(true);
    try {
      let blob: Blob;
      
      if (imageBlob) {
        // From inpainting editor
        blob = imageBlob;
      } else {
        // From basic editor
        const canvas = canvasRef.current;
        if (!canvas) return;
        
        blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((blob) => resolve(blob!), "image/png");
        });
      }

      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Upload the edited image
      const result = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": blob.type },
        body: blob,
      });

      if (!result.ok) {
        throw new Error("Upload failed");
      }

      const { storageId } = await result.json();

      // Update the existing image with edited version
      await updateProductImage({
        imageId: selectedImageId,
        editedImageId: storageId,
      });

      setIsEditing(false);
      setSelectedImageId(null);
      setEditedImageFile(null);
      setOriginalImageData(null);
      resetFilters();
    } catch (error) {
      console.error("Error saving edited image:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleInpaintingSave = (imageBlob: Blob) => {
   void saveEditedImageToDatabase(imageBlob);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setSelectedImageId(null);
    setEditedImageFile(null);
    setOriginalImageData(null);
    resetFilters();
  };

  // Apply filters when values change
  useEffect(() => {
    if (editMode === 'basic') {
      applyFilters();
    }
  }, [brightness, contrast, saturation, originalImageData, editMode]);

  if (productImages === undefined) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const selectedImage = productImages?.find(img => img._id === selectedImageId);

  return (
    <div className="p-6 bg-white rounded-lg shadow-lg">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Edit Photos</h2>
        
        {/* Edit Mode Toggle */}
        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setEditMode('basic')}
            className={`px-4 py-2 rounded-md transition-colors ${
              editMode === 'basic'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            Basic Editor
          </button>
          <button
            onClick={() => setEditMode('inpainting')}
            className={`px-4 py-2 rounded-md transition-colors ${
              editMode === 'inpainting'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            InPainting Editor
          </button>
        </div>
      </div>
      
      {/* Image Gallery with improved styling */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold mb-4 text-gray-700">Select Image to Edit</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {productImages.map((img) => (
            <div
              key={img._id}
              className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                selectedImageId === img._id
                  ? "border-blue-500 shadow-lg ring-2 ring-blue-200 scale-105"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md hover:scale-102"
              }`}
              onClick={() => handleImageSelect(img._id)}
            >
              <div className="aspect-square overflow-hidden">
                <img
                  src={img.url || ""}
                  alt="Product"
                  className="w-full h-full object-cover transition-transform duration-200 group-hover:scale-110"
                />
              </div>
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg px-3 py-1">
                    <span className="text-sm font-medium text-gray-800">
                      {editMode === 'basic' ? 'Edit' : 'InPaint'}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* Badges */}
              <div className="absolute top-2 left-2 flex flex-col gap-1">
                {img.isPrimary && (
                  <div className="bg-blue-500 text-white px-2 py-1 text-xs rounded-full font-medium">
                    Primary
                  </div>
                )}
                {selectedImageId === img._id && (
                  <div className="bg-green-500 text-white px-2 py-1 text-xs rounded-full font-medium">
                    Selected
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Section */}
      {isEditing && selectedImage && (
        <div className="border-t pt-6">
          {editMode === 'inpainting' ? (
            <InPaintingEditor
              imageUrl={selectedImage.url || ""}
              onSave={handleInpaintingSave}
              onCancel={handleCancel}
              isSaving={isSaving}
            />
          ) : (
            <div className="bg-gray-50 rounded-lg p-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Photo Editor</h3>
              
              {/* File Upload */}
              <div className="mb-6">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload New Version
                </button>
              </div>

              {/* Canvas for editing */}
              <div className="mb-6 flex justify-center">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto border-2 border-gray-300 rounded-lg shadow-lg"
                  style={{ maxHeight: "400px" }}
                />
              </div>

              {/* Adjustment Controls */}
              <div className="mb-6 space-y-4">
                <h4 className="text-md font-semibold text-gray-700">Adjustments</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Brightness: {brightness}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={brightness}
                      onChange={(e) => setBrightness(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Contrast: {contrast}
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="100"
                      value={contrast}
                      onChange={(e) => setContrast(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">
                      Saturation: {saturation}%
                    </label>
                    <input
                      type="range"
                      min="-100"
                      max="200"
                      value={saturation}
                      onChange={(e) => setSaturation(Number(e.target.value))}
                      className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* Preset Filters */}
              <div className="mb-6">
                <h4 className="text-md font-semibold text-gray-700 mb-3">Filters</h4>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => applyPresetFilter("grayscale")}
                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Grayscale
                  </button>
                  <button
                    onClick={() => applyPresetFilter("sepia")}
                    className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition-colors"
                  >
                    Sepia
                  </button>
                  <button
                    onClick={() => applyPresetFilter("vintage")}
                    className="px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition-colors"
                  >
                    Vintage
                  </button>
                  <button
                    onClick={() => applyPresetFilter("invert")}
                    className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors"
                  >
                    Invert
                  </button>
                  <button
                    onClick={resetToOriginal}
                    className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => void  saveEditedImageToDatabase()}
                  disabled={isSaving}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      Save Changes
                    </>
                  )}
                </button>
                <button
                  onClick={handleCancel}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}