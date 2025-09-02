import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCamera, FaTimes } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Card from '../components/ui/Card';

const SubmitComplaint = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    offenderPlate: '',
    priority: 'low'
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

  // Submit with timeout and retry logic
  const submitWithRetry = async (complaintData, attempt = 0) => {
    const maxRetries = 3;
    const timeoutDuration = 45000; // 45 seconds for complaint submission
    
    try {
      console.log(`Complaint submission attempt ${attempt + 1}...`);
      
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error('Submission timeout - request took too long'));
        }, timeoutDuration);
      });
      
      // Race between submission and timeout
      const result = await Promise.race([
        addComplaint(complaintData),
        timeoutPromise
      ]);
      
      return result;
    } catch (error) {
      console.error(`Submission attempt ${attempt + 1} failed:`, error);
      
      if (attempt < maxRetries && !error.message?.includes('timeout')) {
        const retryDelay = Math.min(2000 * Math.pow(2, attempt), 8000); // Max 8s delay
        console.log(`Retrying submission in ${retryDelay}ms...`);
        
        setIsRetrying(true);
        setRetryCount(attempt + 1);
        showWarning(`Submission failed, retrying in ${Math.ceil(retryDelay/1000)} seconds...`);
        
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        setIsRetrying(false);
        
        return submitWithRetry(complaintData, attempt + 1);
      } else {
        // Max retries reached or timeout
        const errorMessage = error.message?.includes('timeout') 
          ? 'Submission timed out. Please check your connection and try again.'
          : error.message || 'Submission failed after multiple attempts.';
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
    
    try {
      const complaintData = {
        ...formData,
        image: selectedImageFile // Use the file object directly
      };
      
      const result = await submitWithRetry(complaintData);
      
      if (result.success) {
        showSuccess('Complaint submitted successfully!');
        
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
          priority: 'low'
        });
        setImagePreview(null);
        setSelectedImageFile(null);
        setRetryCount(0);
        
        // Navigate to complaints list
        navigate('/my-complaints');
      } else {
        showError(result.message || 'Failed to submit complaint');
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      showError(error.message || 'Submission failed. Please try again.');
      setErrors({ general: error.message || 'Submission failed. Please try again.' });
    } finally {
      setIsLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Submit a Complaint</h1>
        <p className="text-gray-600 mt-2">Report a traffic violation or offense</p>
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
              onClick={() => navigate('/dashboard')}
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
                  {isRetrying ? `Retrying (${retryCount}/3)...` : 'Submitting...'}
                </div>
              ) : (
                'Submit Complaint'
              )}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubmitComplaint;
