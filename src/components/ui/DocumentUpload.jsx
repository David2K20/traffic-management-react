import React, { useState } from 'react';
import { FaUpload, FaFile, FaTimes } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import Button from './Button';
import FormInput from './FormInput';
import Modal from './Modal';

const DocumentUpload = ({ documentType, onSuccess, isOpen, onClose }) => {
  const [formData, setFormData] = useState({
    expiryDate: ''
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const { addDocument } = useApp();

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsLoading(true);
    setErrors({});

    try {
      const documentData = {
        name: documentTypeNames[documentType],
        type: documentType,
        fileName: selectedFile.name,
        file: selectedFile,
        expiryDate: formData.expiryDate
      };

      const result = await addDocument(documentData);

      if (result.success) {
        alert('Document uploaded successfully!');
        onSuccess && onSuccess(result.document);
        onClose();
        // Reset form
        setFormData({ expiryDate: '' });
        setSelectedFile(null);
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      setErrors({ general: 'An error occurred while uploading the document. Please try again.' });
    } finally {
      setIsLoading(false);
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
            {isLoading ? 'Uploading...' : 'Upload Document'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default DocumentUpload;
