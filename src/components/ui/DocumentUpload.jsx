import React, { useState } from 'react';
import { FaUpload, FaFile, FaTimes } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import Button from './Button';
import FormInput from './FormInput';
import Modal from './Modal';

const DocumentUpload = ({ documentType, onSuccess, isOpen, onClose, isReUpload = false, existingDocument = null }) => {
  const [formData, setFormData] = useState({
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);

  const { addDocument, showSuccess, showError, showWarning, fetchDocuments, state } = useApp();

  const documentTypeNames = {
    license: "Driver's License",
    roadworthiness: 'Road Worthiness Certificate',
    insurance: 'Insurance Certificate'
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
      if (!allowedTypes.includes(file.type)) {
        setErrors({ file: 'Please upload a PDF, JPEG, or PNG file' });
        return;
      }

      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setErrors({ file: 'File size must be less than 50MB' });
        return;
      }

      setSelectedFile(file);
      setErrors({ ...errors, file: '' });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!selectedFile) {
      newErrors.file = 'Please select a file to upload';
    }

    if (!formData.expiryDate) {
      newErrors.expiryDate = 'Expiry date is required';
    } else {
      const expiryDate = new Date(formData.expiryDate);
      const today = new Date();
      if (expiryDate <= today) {
        newErrors.expiryDate = 'Expiry date must be in the future';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Upload with timeout and retry logic
  const uploadWithRetry = async (documentData, isReplacement = false, attempt = 0) => {
    const maxRetries = 3;
    const timeoutDuration = 60000; // 60 seconds for file uploads
    
    try {
      console.log(`Upload attempt ${attempt + 1} for document:`, documentData.fileName);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Upload timeout - request took too long'));
        }, timeoutDuration);
      });
      
      // Race between upload and timeout
      const result = await Promise.race([
        addDocument(documentData, isReplacement),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error(`Upload attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries && !error.message?.includes('timeout')) {
        const retryDelay = Math.min(2000 * Math.pow(2, attempt), 10000); // Max 10s delay
        console.log(`Retrying upload in ${retryDelay}ms...`);
        
        setIsRetrying(true);
        showWarning(`Upload failed, retrying in ${Math.ceil(retryDelay/1000)} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        setIsRetrying(false);
        
        return uploadWithRetry(documentData, isReplacement, attempt + 1);
      } else {
        // Max retries reached or timeout
        const errorMessage = error.message?.includes('timeout') 
          ? 'Upload timed out. Please check your connection and try again.'
          : error.message || 'Upload failed after multiple attempts.';
        throw new Error(errorMessage);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});
    setRetryCount(0);
    setUploadProgress(0);

    try {
      const documentData = {
        name: documentTypeNames[documentType],
        type: documentType,
        fileName: selectedFile.name,
        file: selectedFile,
        expiryDate: formData.expiryDate
      };

      // Determine if this is a replacement upload
      const isReplacement = isReUpload || (existingDocument && existingDocument.status === 'Rejected');
      
      const result = await uploadWithRetry(documentData, isReplacement);

      if (result.success) {
        // Show appropriate success message based on context
        const successMessage = result.isReplacement 
          ? 'Document replaced successfully! Status reset to Pending Review.'
          : isReUpload 
          ? 'New document uploaded, pending admin review'
          : 'Document uploaded successfully!';
        showSuccess(successMessage);
        
        // Auto-refresh documents list to show updated state
        try {
          if (state.currentUser?.id) {
            await fetchDocuments(state.currentUser.id);
          }
        } catch (refreshError) {
          console.error('Error refreshing documents:', refreshError);
        }
        
        // Call onSuccess callback to trigger dashboard refresh
        onSuccess && onSuccess(result.document);
        
        // Reset form and close modal
        setFormData({ expiryDate: '' });
        setSelectedFile(null);
        setRetryCount(0);
        onClose();
      } else {
        showError(result.message || 'Failed to upload document. Please try again.');
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      showError(error.message || 'Failed to upload document. Please try again.');
      setErrors({ general: error.message || 'Failed to upload document. Please try again.' });
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
      setUploadProgress(0);
    }
  };

  const handleClose = () => {
    setFormData({ expiryDate: '' });
    setSelectedFile(null);
    setErrors({});
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Upload ${documentTypeNames[documentType]}`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        {errors.general && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            {errors.general}
          </div>
        )}

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Document File *
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            {selectedFile ? (
              <div className="flex items-center justify-center space-x-2">
                <FaFile className="text-blue-600" />
                <span className="text-sm text-gray-700">{selectedFile.name}</span>
                <button
                  type="button"
                  onClick={() => setSelectedFile(null)}
                  className="text-red-600 hover:text-red-700"
                >
                  <FaTimes />
                </button>
              </div>
            ) : (
              <div>
                <FaUpload className="text-4xl text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">Click to upload document</p>
                <p className="text-xs text-gray-500 mb-4">PDF, JPEG, PNG up to 50MB</p>
                <input
                  id="document-file"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => document.getElementById('document-file').click()}
                >
                  Choose File
                </Button>
              </div>
            )}
          </div>
          {errors.file && (
            <p className="text-red-600 text-sm mt-1">{errors.file}</p>
          )}
        </div>

        {/* Expiry Date */}
        <FormInput
          label="Expiry Date"
          name="expiryDate"
          type="date"
          value={formData.expiryDate}
          onChange={handleInputChange}
          error={errors.expiryDate}
          required
          min={new Date().toISOString().split('T')[0]}
        />

        {/* Submit Buttons */}
        <div className="flex space-x-4">
          <Button
            type="button"
            variant="outline"
            className="flex-1"
            onClick={handleClose}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="flex-1"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                {isRetrying ? 'Retrying...' : 'Uploading...'}
              </div>
            ) : (
              'Upload Document'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUpload;
