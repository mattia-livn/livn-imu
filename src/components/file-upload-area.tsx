'use client';

import React, { useRef, useState } from 'react';
import { Upload, FileText, X } from 'lucide-react';

interface FileUploadAreaProps {
  onFileUpload: (file: File) => void;
  isLoading?: boolean;
}

export function FileUploadArea({ onFileUpload, isLoading = false }: FileUploadAreaProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    if (file.type === 'application/pdf') {
      setSelectedFile(file);
      onFileUpload(file);
    } else {
      alert('Per favore seleziona solo file PDF');
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
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const clearFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
          ${isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
          }
          ${selectedFile ? 'bg-green-50 border-green-300' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={handleFileInputChange}
          className="hidden"
        />
        
        {!selectedFile ? (
          <>
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Carica Visura Catastale
            </h3>
            <p className="text-gray-600 mb-4">
              Trascina qui il file PDF o clicca per selezionarlo
            </p>
            <p className="text-sm text-gray-500">
              Supporta solo file PDF
            </p>
          </>
        ) : isLoading ? (
          <div className="flex items-center justify-center space-x-3">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <div className="text-left">
              <p className="text-sm font-medium text-blue-900">
                Analizzando {selectedFile.name}...
              </p>
              <p className="text-xs text-blue-600">
                Estrazione dati catastali in corso con AI
              </p>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center space-x-3">
            <FileText className="w-8 h-8 text-green-600" />
            <div className="flex-1 text-left">
              <p className="text-sm font-medium text-green-900">
                {selectedFile.name}
              </p>
              <p className="text-xs text-green-600">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Analisi completata
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                clearFile();
              }}
              className="p-1 text-red-500 hover:text-red-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 