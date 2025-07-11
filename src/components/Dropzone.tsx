import { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';

interface DropzoneProps {
  onDrop: (files: File[]) => void;
  accept?: Record<string, string[]>;
  multiple?: boolean;
  className?: string;
}

export function Dropzone({ onDrop, accept, multiple = false, className = '' }: DropzoneProps) {
  const onDropCallback = useCallback((acceptedFiles: File[]) => {
    onDrop(acceptedFiles);
  }, [onDrop]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: onDropCallback,
    accept,
    multiple
  });

  return (
    <div
      {...getRootProps()}
      className={`
        flex flex-col items-center justify-center w-full p-6
        border-2 border-dashed rounded-lg cursor-pointer
        transition-colors duration-200
        ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
        ${className}
      `}
    >
      <input {...getInputProps()} />
      <div className="flex flex-col items-center text-center">
        <svg
          className={`w-12 h-12 mb-4 ${isDragActive ? 'text-indigo-500' : 'text-gray-400'}`}
          stroke="currentColor"
          fill="none"
          viewBox="0 0 48 48"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M24 14v14m-7-7h14m-7 17c-9.389 0-17-7.611-17-17S14.611 4 24 4s17 7.611 17 17-7.611 17-17 17z"
          />
        </svg>
        <p className="mb-2 text-sm text-gray-500">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          {multiple ? 'Upload multiple files' : 'Upload a file'}
        </p>
      </div>
    </div>
  );
}
