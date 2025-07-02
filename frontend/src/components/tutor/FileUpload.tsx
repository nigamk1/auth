import React, { useRef, useState, useCallback } from 'react';
import { 
  PhotoIcon, 
  DocumentTextIcon, 
  XMarkIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface FileUploadProps {
  onFileSelect: (file: File) => void;
  onError: (error: string) => void;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  preview?: boolean;
  className?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  onError,
  accept = 'image/*,.pdf,.doc,.docx,.txt',
  maxSize = 10 * 1024 * 1024, // 10MB
  disabled = false,
  preview = true,
  className = ''
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateFile = (file: File): boolean => {
    // Check file size
    if (file.size > maxSize) {
      onError(`File size must be less than ${Math.round(maxSize / 1024 / 1024)}MB`);
      return false;
    }

    // Check file type
    const acceptedTypes = accept.split(',').map(type => type.trim());
    const fileExtension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    const mimeType = file.type;

    const isValid = acceptedTypes.some(acceptType => {
      if (acceptType.startsWith('.')) {
        return fileExtension === acceptType;
      }
      if (acceptType.includes('*')) {
        const [category] = acceptType.split('/');
        return mimeType.startsWith(category);
      }
      return mimeType === acceptType;
    });

    if (!isValid) {
      onError('File type not supported');
      return false;
    }

    return true;
  };

  const handleFileSelect = useCallback((file: File) => {
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Generate preview for images
    if (preview && file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  }, [onFileSelect, onError, maxSize, accept, preview]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) {
      return <PhotoIcon className="h-8 w-8 text-blue-500" />;
    }
    return <DocumentTextIcon className="h-8 w-8 text-gray-500" />;
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Upload area */}
      {!selectedFile && (
        <div
          onClick={openFileDialog}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragOver 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-gray-400'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
        >
          <CloudArrowUpIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-700 mb-2">
            Click to upload or drag and drop
          </p>
          <p className="text-sm text-gray-500">
            Images, PDFs, and documents up to {Math.round(maxSize / 1024 / 1024)}MB
          </p>
        </div>
      )}

      {/* File preview */}
      {selectedFile && (
        <div className="border rounded-lg p-4 bg-gray-50">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-3">
              {getFileIcon(selectedFile)}
              <div>
                <p className="font-medium text-gray-900 truncate max-w-xs">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              onClick={clearFile}
              variant="outline"
              size="sm"
              className="flex-shrink-0"
            >
              <XMarkIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Image preview */}
          {previewUrl && selectedFile.type.startsWith('image/') && (
            <div className="mt-3">
              <img
                src={previewUrl}
                alt="Preview"
                className="max-w-full h-32 object-contain rounded-lg border"
              />
            </div>
          )}

          {/* Replace file button */}
          <Button
            type="button"
            onClick={openFileDialog}
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            disabled={disabled}
          >
            Replace file
          </Button>
        </div>
      )}
    </div>
  );
};

export default FileUpload;
