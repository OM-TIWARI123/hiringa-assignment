import { useState, useCallback } from "react";
// Pintura
import "@pqina/pintura/pintura.css";
import {
  openEditor,
  locale_en_gb,
  createDefaultImageReader,
  createDefaultImageWriter,
  createDefaultImageOrienter,
  createDefaultShapePreprocessor,
  legacyDataToImageState,
  processImage,
  // plugins
  setPlugins,
  plugin_crop,
  plugin_crop_locale_en_gb,
  plugin_finetune,
  plugin_finetune_locale_en_gb,
  plugin_finetune_defaults,
  plugin_filter,
  plugin_filter_locale_en_gb,
  plugin_filter_defaults,
  plugin_annotate,
  plugin_annotate_locale_en_gb,
  markup_editor_defaults,
  markup_editor_locale_en_gb,
} from "@pqina/pintura";
// Filepond
import "filepond/dist/filepond.min.css";
import "filepond-plugin-file-poster/dist/filepond-plugin-file-poster.min.css";
import { FilePond, registerPlugin } from "react-filepond";
import FilePondPluginFileValidateType from "filepond-plugin-file-validate-type";
import FilePondPluginFilePoster from "filepond-plugin-file-poster";
import FilePondPluginImageEditor from "@pqina/filepond-plugin-image-editor";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import FilePondPluginImageTransform from "filepond-plugin-image-transform";

registerPlugin(
  FilePondPluginFileValidateType,
  FilePondPluginImageEditor,
  FilePondPluginFilePoster,
  FilePondPluginImageTransform  
);

// Pintura plugins
setPlugins(plugin_crop, plugin_finetune, plugin_filter, plugin_annotate);

// Pintura editor defaults
const editorDefaults = {
  imageReader: createDefaultImageReader(),
  imageWriter: createDefaultImageWriter(),
  shapePreprocessor: createDefaultShapePreprocessor(),
  ...plugin_finetune_defaults,
  ...plugin_filter_defaults,
  ...markup_editor_defaults,
  locale: {
    ...locale_en_gb,
    ...plugin_crop_locale_en_gb,
    ...plugin_finetune_locale_en_gb,
    ...plugin_filter_locale_en_gb,
    ...plugin_annotate_locale_en_gb,
    ...markup_editor_locale_en_gb,
  },
};

interface EditPhotoProps {
  campaignId: string | null;
}

export const EditPhoto = ({ campaignId }: EditPhotoProps) => {
  const [files, setFiles] = useState<any[]>([]);
  const [editedImage, setEditedImage] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editingImageId, setEditingImageId] = useState<Id<"productImages"> | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Convex functions
  const productImages = useQuery(api.productImage.getProductImages, 
    campaignId ? { campaignId: campaignId as Id<"campaigns"> } : "skip"
  );
  const updateProductImage = useMutation(api.productImage.updateProductImage);
  const generateUploadUrl = useMutation(api.productImage.generateUploadUrl);
  const createProductImage = useMutation(api.productImage.saveProductImage);

  const handleSave = useCallback(async () => {
    if (files.length === 0 || !campaignId) return;
    
    setIsSaving(true);
    
    // Get the file - it could be the edited version or original
    const fileItem = files[0];
    const fileToUpload = editedImage || fileItem.file;

    try {
      // Generate upload URL
      const uploadUrl = await generateUploadUrl();
      
      // Upload the edited image
      const response = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": fileToUpload.type },
        body: fileToUpload,
      });
      const { storageId } = await response.json();

      if (editingImageId) {
        // Update existing image
        await updateProductImage({ 
          imageId: editingImageId, 
          editedImageId: storageId,
        });
      } else {
        // Create new image
        await createProductImage({ 
          campaignId: campaignId as Id<"campaigns">,
          productImageId: storageId,
          isPrimary: false
        });
      }
      
      // Reset editor state
      setFiles([]);
      setEditedImage(null);
      setEditingImageId(null);
    } catch (error) {
      console.error("Error saving image:", error);
    } finally {
      setIsSaving(false);
    }
  }, [
    files,
    editedImage, 
    campaignId, 
    editingImageId, 
    generateUploadUrl, 
    updateProductImage, 
    createProductImage
  ]);

  const handleSelectExistingImage = (imageId: Id<"productImages">, url: string) => {
    setEditingImageId(imageId);
    setFiles([
      {
        source: url,
        options: {
          type: "limbo",
          metadata: { productImageId: imageId },
        },
      },
    ]);
  };

  // Reset current image index when switching to a different image
  const handleImageChange = (imageId: Id<"productImages">, url: string) => {
    handleSelectExistingImage(imageId, url);
    // Find the index of the selected image
    const imageIndex = productImages?.findIndex(img => img._id === imageId) || 0;
    setCurrentImageIndex(imageIndex);
  };

  const handlePrevImage = () => {
    if (currentImageIndex > 0) {
      setIsTransitioning(true);
      setCurrentImageIndex(prev => prev - 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleNextImage = () => {
    if (productImages && currentImageIndex < productImages.length - 1) {
      setIsTransitioning(true);
      setCurrentImageIndex(prev => prev + 1);
      setTimeout(() => setIsTransitioning(false), 300);
    }
  };

  const handleDownload = () => {
    if (!productImages) return;
    const imageUrl = productImages[currentImageIndex]?.url;
    if (!imageUrl) return;
  
    // Create a temporary link element
    const link = document.createElement("a");
    link.href = imageUrl;
    link.download = `product-image-${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  

  return (
    <div className="flex flex-col gap-4 sm:gap-8">
      {/* Existing images gallery */}
      {productImages && productImages.length > 0 && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-base sm:text-lg font-medium text-gray-900">Edit existing images:</h3>
            <div className="text-sm text-gray-500">
              {productImages.length > 0 ? `${currentImageIndex + 1} of ${productImages.length}` : 'No images'}
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
              disabled={currentImageIndex >= (productImages?.length || 0) - 1}
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
              {productImages[currentImageIndex] && (
                <div 
                  className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-square transition-all max-w-md mx-auto ${
                    editingImageId === productImages[currentImageIndex]._id 
                      ? "border-blue-500 ring-2 ring-blue-300" 
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                  onClick={() => handleImageChange(productImages[currentImageIndex]._id, productImages[currentImageIndex].url || '')}
                >
                  <img 
                    src={productImages[currentImageIndex].url || ''} 
                    alt="Product" 
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Download button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload()
                    }}
                    className="absolute top-2 right-2 px-2 py-1 bg-white/90 hover:bg-white text-gray-700 rounded-md shadow-sm transition-colors text-xs font-medium"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </button>
                  
                  {editingImageId === productImages[currentImageIndex]._id && (
                    <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                      <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                        Editing
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FilePond Editor */}
      <div className="border border-gray-200 rounded-lg p-4 sm:p-6 bg-white shadow-sm">
        <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-4">
          {editingImageId ? "Edit Image" : "Upload & Edit Image"}
        </h3>
        
        <FilePond
          files={files}
          onupdatefiles={(fileItems) => {
            setFiles(fileItems);
            if (fileItems.length === 0) {
              setEditingImageId(null);
              setEditedImage(null);
            } else {
              // Check if the file has been processed/edited
              const fileItem = fileItems[0];
              if (fileItem.file && fileItem.file instanceof File) {
                setEditedImage(fileItem.file);
              }
              if (!editingImageId) {
                setEditingImageId(null);
              }
            }
          }}
          onpreparefile={(fileItem,output)=>{
            const edited=output instanceof File
            ?output:new File([output],fileItem.filename,{type:output.type})
            setEditedImage(edited)
          }}
          acceptedFileTypes={["image/*"]}
          allowMultiple={false}
          maxFiles={1}
          name="image"
          filePosterMaxHeight={256}
          imageEditor={{
            legacyDataToImageState: legacyDataToImageState,
            createEditor: openEditor,
            imageReader: [createDefaultImageReader],
            imageWriter: [createDefaultImageWriter],
            imageProcessor: processImage,
            editorOptions: {
              utils: ["crop", "finetune", "filter", "annotate"],
              imageOrienter: createDefaultImageOrienter(),
              ...editorDefaults,
            },
          }}
          onprocessfile={(error, file) => {
            console.log('err :',error,"file :",file)
            if (!error && file) {
              // Store the edited image when processing is complete
              setEditedImage(file.file);
              console.log("EditedImage")
            }
          }}
          onaddfile={(error, file) => {
            if (!error && file && file.file instanceof File) {
              setEditedImage(file.file);
            }
          }}
          className="filepond-editor"
        />

        {/* Save Button */}
        <div className="flex justify-end mt-4 sm:mt-6">
          <button 
            onClick={() => {
              handleSave().catch(console.error);
            }}
            disabled={files.length === 0 || isSaving}
            className={`
              px-4 sm:px-6 py-2 sm:py-2 rounded-md font-medium transition-colors w-full sm:w-auto
              ${files.length === 0 || isSaving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }
            `}
          >
            {isSaving ? (
              <span className="flex items-center justify-center sm:justify-start">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Saving...
              </span>
            ) : "Save Edited Image"}
          </button>
        </div>
      </div>
    </div>
  );
};