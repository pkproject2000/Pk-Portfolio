import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface UploadManagerProps {
  onUploadComplete?: (url: string, path: string) => void;
  onUploadStart?: () => void;
  onUploadError?: (error: string) => void;
  onClear?: () => void;
  bucketName?: string;
  folderPath?: string;
  acceptedFormats?: Record<string, string[]>;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const DEFAULT_ACCEPTED_FORMATS = {
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx']
};

export function UploadManager({ 
  onUploadComplete, 
  onUploadStart,
  onUploadError,
  onClear,
  bucketName = 'portfolios', 
  folderPath = 'uploads',
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS
}: UploadManagerProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleUpload = async (fileToUpload: File) => {
    setStatus('uploading');
    setProgress(10); // Start progress
    if (onUploadStart) onUploadStart();

    let progressInterval: NodeJS.Timeout | undefined;

    try {
      const fileExt = fileToUpload.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${folderPath}/${fileName}`;

      // Simulate progress since Supabase JS client doesn't have native upload progress yet
      progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      if (!isSupabaseConfigured) {
        // Mock upload for demo mode
        await new Promise(resolve => setTimeout(resolve, 1500));
        clearInterval(progressInterval);
        setProgress(100);
        setStatus('success');
        
        const fakeUrl = URL.createObjectURL(fileToUpload);
        if (onUploadComplete) {
          onUploadComplete(fakeUrl, filePath);
        }
        return;
      }

      const uploadPromise = supabase.storage
        .from(bucketName)
        .upload(filePath, fileToUpload, {
          cacheControl: '3600',
          upsert: false
        });

      // Add a 30-second timeout to the upload
      let timeoutId: any;
      try {
        const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
          timeoutId = setTimeout(() => reject(new Error('Upload timed out. Please check your connection and Supabase configuration.')), 120000);
        });

        const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);
        if (error) throw error;

        setProgress(100);
        setStatus('success');

        const { data: publicUrlData } = supabase.storage
          .from(bucketName)
          .getPublicUrl(filePath);

        if (onUploadComplete) {
          onUploadComplete(publicUrlData.publicUrl, filePath);
        }
      } finally {
        clearTimeout(timeoutId);
        clearInterval(progressInterval);
      }
    } catch (err: any) {
      clearInterval(progressInterval);
      console.error('Upload error:', err);
      setStatus('error');
      const msg = err.message || 'Failed to upload file.';
      setErrorMessage(msg);
      if (onUploadError) onUploadError(msg);
      setProgress(0);
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        setErrorMessage('File is larger than 50MB limit.');
      } else if (error.code === 'file-invalid-type') {
        setErrorMessage('File type not supported.');
      } else {
        setErrorMessage(error.message);
      }
      setStatus('error');
      return;
    }

    const selectedFile = acceptedFiles[0];
    if (selectedFile) {
      setFile(selectedFile);
      setStatus('idle');
      setErrorMessage(null);
      setProgress(0);

      // Create preview for images
      if (selectedFile.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(selectedFile);
        setPreview(objectUrl);
      } else {
        setPreview(null);
      }
      
      // Auto-upload
      handleUpload(selectedFile);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 1
  } as any);

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    setStatus('idle');
    setErrorMessage(null);
    setProgress(0);
    if (onClear) onClear();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {!file ? (
        <div 
          {...getRootProps()} 
          className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
            ${status === 'error' ? 'border-red-500 bg-red-50 dark:bg-red-500/10' : ''}
          `}
        >
          <input {...getInputProps()} />
          <div className="flex flex-col items-center justify-center space-y-4">
            <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-900 dark:text-white">
                {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                Supports .jpg, .png, .webp, .pdf, .docx, .pptx (Max 50MB)
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              {preview ? (
                <div className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                  <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-16 h-16 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 dark:border-slate-700">
                  {file.type.includes('pdf') ? <FileIcon className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                  {file.name}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {(file.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
            
            {status !== 'uploading' && status !== 'success' && (
              <button 
                onClick={clearFile}
                className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {status === 'uploading' && (
            <div className="mt-4">
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                <span className="text-slate-900 dark:text-white font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}

          {status === 'success' && (
            <div className="mt-4 flex items-center text-sm text-emerald-600 dark:text-emerald-400 font-medium bg-emerald-50 dark:bg-emerald-500/10 p-2 rounded-lg">
              <CheckCircle className="w-4 h-4 mr-2" />
              Upload complete!
            </div>
          )}
        </div>
      )}

      {status === 'error' && errorMessage && (
        <div className="mt-4 flex items-center text-sm text-red-600 dark:text-red-400 font-medium bg-red-50 dark:bg-red-500/10 p-3 rounded-lg">
          <AlertCircle className="w-4 h-4 mr-2 shrink-0" />
          {errorMessage}
        </div>
      )}
    </div>
  );
}
