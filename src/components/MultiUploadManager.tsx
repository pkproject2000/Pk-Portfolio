import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, File as FileIcon, Image as ImageIcon, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

interface MultiUploadManagerProps {
  onUploadComplete?: (urls: string[], paths: string[]) => void;
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
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
  'text/plain': ['.txt'],
  'text/markdown': ['.md'],
  'application/json': ['.json'],
  'text/csv': ['.csv'],
  'application/zip': ['.zip'],
  'video/mp4': ['.mp4']
};

interface FileState {
  file: File;
  preview: string | null;
  progress: number;
  status: 'idle' | 'uploading' | 'success' | 'error';
  errorMessage: string | null;
  url: string | null;
  path: string | null;
}

export function MultiUploadManager({ 
  onUploadComplete, 
  onUploadStart,
  onUploadError,
  onClear,
  bucketName = 'portfolios', 
  folderPath = 'uploads',
  acceptedFormats = DEFAULT_ACCEPTED_FORMATS
}: MultiUploadManagerProps) {
  const [files, setFiles] = useState<FileState[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const handleUpload = async (filesToUpload: FileState[]) => {
    setIsUploading(true);
    if (onUploadStart) onUploadStart();

    const updatedFiles = [...filesToUpload];
    let hasError = false;

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileState = updatedFiles[i];
      if (fileState.status === 'success') continue;

      fileState.status = 'uploading';
      fileState.progress = 10;
      setFiles([...updatedFiles]);

      try {
        const fileExt = fileState.file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `${folderPath}/${fileName}`;

        // Simulate progress
        const progressInterval = setInterval(() => {
          setFiles(current => {
            const newFiles = [...current];
            if (newFiles[i] && newFiles[i].status === 'uploading' && newFiles[i].progress < 90) {
              newFiles[i].progress += 10;
            } else {
              clearInterval(progressInterval);
            }
            return newFiles;
          });
        }, 200);

        if (!isSupabaseConfigured) {
          await new Promise(resolve => setTimeout(resolve, 1500));
          clearInterval(progressInterval);
          
          fileState.progress = 100;
          fileState.status = 'success';
          fileState.url = URL.createObjectURL(fileState.file);
          fileState.path = filePath;
        } else {
          const uploadPromise = supabase.storage
            .from(bucketName)
            .upload(filePath, fileState.file, {
              cacheControl: '3600',
              upsert: false
            });

          let timeoutId: any;
          try {
            const timeoutPromise = new Promise<{ data: any, error: any }>((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error('Upload timed out. Please check your connection and Supabase configuration.')), 120000);
            });

            const { data, error } = await Promise.race([uploadPromise, timeoutPromise]);
            if (error) throw error;

            const { data: publicUrlData } = supabase.storage
              .from(bucketName)
              .getPublicUrl(filePath);

            fileState.progress = 100;
            fileState.status = 'success';
            fileState.url = publicUrlData.publicUrl;
            fileState.path = filePath;
          } finally {
            clearTimeout(timeoutId);
            clearInterval(progressInterval);
          }
        }
      } catch (err: any) {
        if (typeof progressInterval !== 'undefined') {
          clearInterval(progressInterval);
        }
        // Find and clear the interval for this specific file if it exists
        // We can't easily access the specific interval ID here, but the interval
        // itself checks if progress < 90, so it will eventually stop.
        // However, we should force progress to 0 to stop it immediately.
        fileState.progress = 0;
        console.error('Upload error:', err);
        fileState.status = 'error';
        fileState.errorMessage = err.message || 'Failed to upload file.';
        hasError = true;
      }
      
      setFiles([...updatedFiles]);
    }

    setIsUploading(false);

    if (hasError && onUploadError) {
      onUploadError('Some files failed to upload.');
    }

    if (onUploadComplete) {
      const successfulFiles = updatedFiles.filter(f => f.status === 'success' && f.url && f.path);
      onUploadComplete(
        successfulFiles.map(f => f.url as string),
        successfulFiles.map(f => f.path as string)
      );
    }
  };

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    if (rejectedFiles.length > 0 && onUploadError) {
      const error = rejectedFiles[0].errors[0];
      if (error.code === 'file-too-large') {
        onUploadError('One or more files are larger than 50MB limit.');
      } else if (error.code === 'file-invalid-type') {
        onUploadError('One or more file types are not supported.');
      } else {
        onUploadError(error.message);
      }
    }

    const newFileStates: FileState[] = acceptedFiles.map(file => {
      let preview = null;
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      return {
        file,
        preview,
        progress: 0,
        status: 'idle',
        errorMessage: null,
        url: null,
        path: null
      };
    });

    if (newFileStates.length > 0) {
      const combined = [...files, ...newFileStates];
      setFiles(combined);
      handleUpload(combined);
    }
  }, [files, handleUpload, onUploadError]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: acceptedFormats,
    maxSize: MAX_FILE_SIZE,
    maxFiles: 10 // Allow up to 10 files
  } as any);

  const removeFile = (index: number) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
    
    if (onUploadComplete) {
      const successfulFiles = newFiles.filter(f => f.status === 'success' && f.url && f.path);
      onUploadComplete(
        successfulFiles.map(f => f.url as string),
        successfulFiles.map(f => f.path as string)
      );
    }
    
    if (newFiles.length === 0 && onClear) {
      onClear();
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        {...getRootProps()} 
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-colors mb-4
          ${isDragActive ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-500/10' : 'border-slate-300 dark:border-slate-700 hover:border-indigo-400 dark:hover:border-indigo-500 hover:bg-slate-50 dark:hover:bg-slate-800/50'}
        `}
      >
        <input {...getInputProps()} />
        <div className="flex flex-col items-center justify-center space-y-3">
          <div className="p-3 bg-indigo-100 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              {isDragActive ? 'Drop the files here' : 'Drag & drop files here, or click to select'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Supports multiple files (Max 50MB each)
            </p>
          </div>
        </div>
      </div>

      {files.length > 0 && (
        <div className="space-y-3">
          {files.map((fileState, index) => (
            <div key={`${fileState.file.name}-${index}`} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-3 shadow-sm">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3 overflow-hidden">
                  {fileState.preview ? (
                    <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0">
                      <img src={fileState.preview} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 shrink-0 border border-slate-200 dark:border-slate-700">
                      {fileState.file.type.includes('pdf') ? <FileIcon className="w-6 h-6" /> : <FileIcon className="w-6 h-6" />}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
                      {fileState.file.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {(fileState.file.size / (1024 * 1024)).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                
                {fileState.status !== 'uploading' && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); removeFile(index); }}
                    className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {fileState.status === 'uploading' && (
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-600 dark:text-slate-400">Uploading...</span>
                    <span className="text-slate-900 dark:text-white font-medium">{fileState.progress}%</span>
                  </div>
                  <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className="bg-indigo-600 h-1.5 rounded-full transition-all duration-300 ease-out" 
                      style={{ width: `${fileState.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {fileState.status === 'success' && (
                <div className="mt-2 flex items-center text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                  <CheckCircle className="w-3.5 h-3.5 mr-1.5" />
                  Uploaded
                </div>
              )}

              {fileState.status === 'error' && (
                <div className="mt-2 flex items-center text-xs text-red-600 dark:text-red-400 font-medium">
                  <AlertCircle className="w-3.5 h-3.5 mr-1.5 shrink-0" />
                  <span className="truncate">{fileState.errorMessage}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
