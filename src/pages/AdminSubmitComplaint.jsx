import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaTimes, FaShieldAlt } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Card from '../components/ui/Card';

const AdminSubmitComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    offenderPlate: '',
    priority: 'medium'
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  
  const { addComplaint, showSuccess, showError, showWarning, fetchComplaints, state } = useApp();
  const { currentUser } = state;
  const navigate = useNavigate();

  const categories = [
    { value: 'wrong_parking', label: 'Wrong Parking' },
    { value: 'noise_pollution', label: 'Noise Pollution' },
    { value: 'blocked_driveway', label: 'Blocked Driveway' },
    { value: 'illegal_horn', label: 'Illegal Use of Horn' },
    { value: 'overspeeding', label: 'Overspeeding' },
    { value: 'no_seatbelt', label: 'No Seatbelt' },
    { value: 'phone_driving', label: 'Phone Use While Driving' },
    { value: 'others', label: 'Others' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setImagePreview(null);
    setSelectedImageFile(null);
    document.getElementById('image').value = '';
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }
    
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }
    
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    }
    
    if (!formData.category) {
      newErrors.category = 'Category is required';
    }
    
    if (!formData.offenderPlate.trim()) {
      newErrors.offenderPlate = 'Offender plate number is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    setRetryCount(0);
    setErrors({});
    
    const attemptSubmission = async (attempt = 1) => {
      try {
        const complaintData = {
          ...formData,
          image: selectedImageFile // Use the file object directly
        };
        
        const result = await Promise.race([
          addComplaint(complaintData),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Submission timeout')), 45000)
          )
        ]);
        
        if (result.success) {
          showSuccess('Official complaint submitted successfully!');
          
          // Auto-refresh complaints list
          try {
            await fetchComplaints();
          } catch (refreshError) {
            console.error('Error refreshing complaints:', refreshError);
          }
          
          // Clear form
          setFormData({
            title: '',
            description: '',
            location: '',
            category: '',
            offenderPlate: '',
            priority: 'medium'
          });
          setImagePreview(null);
          setSelectedImageFile(null);
          
          // Navigate to complaints list
          navigate('/admin/complaints');
        } else {
          throw new Error(result.message || 'Failed to submit complaint');
        }
      } catch (error) {
        console.error(`Error submitting complaint (attempt ${attempt}):`, error);
        
        if (attempt < 3) {
          // Retry with exponential backoff
          const backoffTime = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
          setRetryCount(attempt);
          setIsRetrying(true);
          
          showWarning(`Submission attempt failed. Retrying in ${backoffTime/1000} seconds...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return attemptSubmission(attempt + 1);
        } else {
          // All retry attempts failed
          const errorMessage = 'Failed to submit after multiple attempts. Please try again later.';
          showError(errorMessage);
          setErrors({ general: errorMessage });
          throw error;
        }
      } finally {
        if (attempt === 3 || !isRetrying) {
          setIsLoading(false);
          setIsRetrying(false);
        }
      }
    };
    
    try {
      await attemptSubmission();
    } catch (error) {
      // Final error already handled in the attemptSubmission function
      console.error('Submission ultimately failed:', error);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <FaShieldAlt className="text-2xl text-blue-600 mr-3" />
          <h1 className="text-3xl font-bold text-gray-900">Submit Official Complaint</h1>
        </div>
        <p className="text-gray-600">Report a traffic violation as a law enforcement officer</p>
        <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> This complaint will be marked as submitted by law enforcement and will appear in the system with an "Official" badge.
          </p>
        </div>
      </div>

      <Card>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.general && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {errors.general}
            </div>
          )}

          <FormInput
            label="Complaint Title"
            name="title"
            value={formData.title}
            onChange={handleInputChange}
            error={errors.title}
            required
            placeholder="Brief title describing the violation"
          />

          <FormInput
            label="Category"
            name="category"
            type="select"
            value={formData.category}
            onChange={handleInputChange}
            error={errors.category}
            required
          >
            <option value="">-- Select Category --</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </FormInput>

          <FormInput
            label="Offender's Plate Number"
            name="offenderPlate"
            value={formData.offenderPlate}
            onChange={handleInputChange}
            error={errors.offenderPlate}
            required
            placeholder="Enter the vehicle's plate number"
          />

          <FormInput
            label="Location"
            name="location"
            value={formData.location}
            onChange={handleInputChange}
            error={errors.location}
            required
            placeholder="Where did this incident occur?"
          />

          <FormInput
            label="Priority Level"
            name="priority"
            type="select"
            value={formData.priority}
            onChange={handleInputChange}
          >
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </FormInput>

          <FormInput
            label="Description"
            name="description"
            type="textarea"
            rows="4"
            value={formData.description}
            onChange={handleInputChange}
            error={errors.description}
            required
            placeholder="Provide detailed description of what happened..."
          />

          {/* Image Upload */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Evidence (Optional)
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              {imagePreview ? (
                <div className="relative">
                  <img 
                    src={imagePreview} 
                    alt="Preview" 
                    className="max-w-full h-48 object-cover mx-auto rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                  >
                    <FaTimes className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <div>
                  <FaCamera className="text-4xl text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Click to upload an image</p>
                  <input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => document.getElementById('image').click()}
                  >
                    Choose Image
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="flex space-x-4">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => navigate('/admin/dashboard')}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading && (
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {isLoading 
                ? (isRetrying ? `Retrying (${retryCount}/3)...` : 'Submitting...')
                : 'Submit Official Complaint'
              }
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default AdminSubmitComplaint;
