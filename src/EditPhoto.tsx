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

  return (
    <div className="flex flex-col gap-8">
      {/* Existing images gallery */}
      {productImages && productImages.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900">Edit existing images:</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {productImages.map((image) => (
              <div 
                key={image._id} 
                className={`relative cursor-pointer rounded-lg overflow-hidden border-2 aspect-square transition-all ${
                  editingImageId === image._id 
                    ? "border-blue-500 ring-2 ring-blue-300" 
                    : "border-gray-200 hover:border-gray-300"
                }`}
                onClick={() => handleSelectExistingImage(image._id, image.url || '')}
              >
                <img 
                  src={image.url || ''} 
                  alt="Product" 
                  className="w-full h-full object-cover"
                />
                {editingImageId === image._id && (
                  <div className="absolute inset-0 bg-blue-500 bg-opacity-20 flex items-center justify-center">
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Editing
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* FilePond Editor */}
      <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
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
        <div className="flex justify-end mt-6">
          <button 
            onClick={() => {
              handleSave().catch(console.error);
            }}
            disabled={files.length === 0 || isSaving}
            className={`
              px-6 py-2 rounded-md font-medium transition-colors
              ${files.length === 0 || isSaving
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }
            `}
          >
            {isSaving ? (
              <span className="flex items-center">
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