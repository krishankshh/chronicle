/**
 * Image Upload component with preview
 */
import { useState, useRef } from 'react';
import Button from './ui/Button';
import Alert from './ui/Alert';

const ImageUpload = ({
  currentImage,
  onImageSelect,
  maxSize = 5, // MB
  acceptedFormats = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'],
  shape = 'circle', // 'circle' or 'square'
  label = 'Upload Image',
}) => {
  const [preview, setPreview] = useState(currentImage || null);
  const [error, setError] = useState('');
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setError('');

    // Validate file type
    if (!acceptedFormats.includes(file.type)) {
      setError(`Invalid file type. Accepted formats: ${acceptedFormats.map(f => f.split('/')[1]).join(', ')}`);
      return;
    }

    // Validate file size
    const fileSizeMB = file.size / 1024 / 1024;
    if (fileSizeMB > maxSize) {
      setError(`File size must be less than ${maxSize}MB`);
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Pass file to parent
    if (onImageSelect) {
      onImageSelect(file);
    }
  };

  const handleRemove = () => {
    setPreview(null);
    setError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onImageSelect) {
      onImageSelect(null);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const shapeClasses = shape === 'circle' ? 'rounded-full' : 'rounded-lg';

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className={`w-32 h-32 ${shapeClasses} bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center overflow-hidden`}>
          {preview ? (
            <img
              src={preview}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="mt-1 text-xs text-gray-500">No image</p>
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex-1 space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFormats.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
          <div className="flex gap-2">
            <Button onClick={handleClick} variant="outline" size="sm">
              {preview ? 'Change' : label}
            </Button>
            {preview && (
              <Button onClick={handleRemove} variant="ghost" size="sm">
                Remove
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-500">
            Max size: {maxSize}MB. Formats: {acceptedFormats.map(f => f.split('/')[1].toUpperCase()).join(', ')}
          </p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <Alert variant="error">
          {error}
        </Alert>
      )}
    </div>
  );
};

export default ImageUpload;
