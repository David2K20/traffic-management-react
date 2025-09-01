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
  
  const { addComplaint, state } = useApp();
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
    setErrors({});
    
    try {
      const complaintData = {
        ...formData,
        image: selectedImageFile // Use the file object directly
      };
      
      const result = await addComplaint(complaintData);
      
      if (result.success) {
        alert('Complaint submitted successfully!');
        navigate('/my-complaints');
      } else {
        setErrors({ general: result.message });
      }
    } catch (error) {
      console.error('Error submitting complaint:', error);
      setErrors({ general: 'An error occurred while submitting the complaint. Please try again.' });
    } finally {
      setIsLoading(false);
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
              {isLoading ? 'Submitting...' : 'Submit Complaint'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SubmitComplaint;
