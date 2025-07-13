

import { useCallback, useState, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "../ui/button";
import { Upload as UploadIcon, Image as ImageIcon, X } from "lucide-react";
import { formatFileSize } from "../../lib/utils";

interface ImageUploadProps {
  onImageSelect: (imageData: string) => void;
  currentImage: string | null;
  onError?: (error: string) => void;
}

export function ImageUpload({ onImageSelect, currentImage, onError }: ImageUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Update the selected file when the current image changes
  useEffect(() => {
    if (!currentImage) {
      setSelectedFile(null);
    }
  }, [currentImage]);

  const onDrop = useCallback(
    (acceptedFiles: File[], fileRejections: any) => {
      if (fileRejections?.length > 0) {
        const error = fileRejections[0].errors[0];
        onError?.(error.message);
        return;
      }

      const file = acceptedFiles[0];
      if (!file) return;

      setSelectedFile(file);
      setIsLoading(true);

      // Convert the file to base64
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          const result = event.target.result as string;
          onImageSelect(result);
        }
        setIsLoading(false);
      };
      reader.onerror = (error) => {
        onError?.("Error reading file. Please try again.");
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    },
    [onImageSelect]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "image/png": [".png"],
      "image/jpeg": [".jpg", ".jpeg"]
    },
    maxSize: 10 * 1024 * 1024, // 10MB
    multiple: false
  });

  const handleRemove = () => {
    setSelectedFile(null);
    onImageSelect("");
  };

  return (
    <div className="w-full">
      {!currentImage ? (
        <div
          {...getRootProps()}
          className={`min-h-[120px] sm:min-h-[150px] p-3 sm:p-4 rounded-lg
          ${isDragActive ? "bg-secondary/50" : "bg-secondary"}
          ${isLoading ? "opacity-50 cursor-wait" : ""}
          transition-colors duration-200 ease-in-out hover:bg-secondary/50
          border-2 border-dashed border-secondary
          cursor-pointer flex items-center justify-center gap-2 sm:gap-4
        `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col sm:flex-row items-center text-center sm:text-left" role="presentation">
            <UploadIcon className="w-6 h-6 sm:w-8 sm:h-8 text-primary mb-2 sm:mb-0 sm:mr-3 flex-shrink-0" aria-hidden="true" />
            <div className="space-y-1">
              <p className="text-xs sm:text-sm font-medium text-foreground">
                Drop your image here or tap to browse
              </p>
              <p className="text-xs text-muted-foreground">
                Max: 10MB
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center p-4 rounded-lg bg-secondary">
          <div className="flex w-full items-center mb-4">
            <ImageIcon className="w-8 h-8 text-primary mr-3 flex-shrink-0" aria-hidden="true" />
            <div className="flex-grow min-w-0">
              <p className="text-sm font-medium truncate text-foreground">
                {selectedFile?.name || "Current Image"}
              </p>
              {selectedFile && (
                <p className="text-xs text-muted-foreground">
                  {formatFileSize(selectedFile?.size ?? 0)}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRemove}
              className="flex-shrink-0 ml-2"
            >
              <X className="w-4 h-4" />
              <span className="sr-only">Remove image</span>
            </Button>
          </div>
          <div className="w-full overflow-hidden rounded-md">
            <img
              src={currentImage}
              alt="Selected"
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      )}
    </div>
  );
}