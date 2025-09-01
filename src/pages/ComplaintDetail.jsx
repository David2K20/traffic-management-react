import React from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { FaArrowLeft, FaMapMarkerAlt, FaClock, FaUser, FaCar } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { state } = useApp();
  
  const complaint = state.complaints.find(c => c.id === id);
  
  if (!complaint) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card>
          <div className="text-center py-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Complaint Not Found</h2>
            <p className="text-gray-600 mb-6">The complaint you're looking for doesn't exist.</p>
            <Button onClick={() => navigate('/my-complaints')}>
              Back to My Complaints
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case 'pending': return 'pending';
      case 'resolved': return 'resolved';
      case 'rejected': return 'rejected';
      default: return 'default';
    }
  };

  const getPriorityBadgeVariant = (priority) => {
    switch (priority) {
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'default';
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <Button 
          variant="ghost" 
          onClick={() => navigate(-1)}
          className="mb-4 text-blue-600 hover:text-blue-700"
        >
          <FaArrowLeft className="mr-2" />
          Back
        </Button>
        
        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{complaint.title}</h1>
            <p className="text-gray-600 mt-2">Complaint ID: #{complaint.id}</p>
          </div>
          
          <div className="flex flex-wrap gap-2 mt-4 md:mt-0">
            <Badge variant={getStatusBadgeVariant(complaint.status)} size="lg">
              {complaint.status.toUpperCase()}
            </Badge>
            <Badge variant={getPriorityBadgeVariant(complaint.priority)} size="lg">
              {complaint.priority.toUpperCase()} PRIORITY
            </Badge>
            {complaint.submittedBy === 'admin' && (
              <Badge variant="official" size="lg">
                OFFICIAL
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
            <p className="text-gray-700 leading-relaxed">{complaint.description}</p>
          </Card>

          {/* Evidence Image */}
          {complaint.image && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Evidence</h3>
              <img 
                src={complaint.image} 
                alt="Complaint evidence" 
                className="w-full rounded-lg shadow-md"
              />
            </Card>
          )}

          {/* Admin Response */}
          {complaint.adminComments && (
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Official Response</h3>
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <p className="text-blue-800">{complaint.adminComments}</p>
              </div>
            </Card>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Details Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Details</h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <FaClock className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Date Reported</p>
                  <p className="text-sm text-gray-600">{formatDate(complaint.dateReported)}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaMapMarkerAlt className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Location</p>
                  <p className="text-sm text-gray-600">{complaint.location}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaCar className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Offender Vehicle</p>
                  <p className="text-sm text-gray-600">{complaint.offenderPlate}</p>
                </div>
              </div>
              
              <div className="flex items-center">
                <FaUser className="text-gray-400 mr-3" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Reported By</p>
                  <p className="text-sm text-gray-600">{complaint.reportedByName}</p>
                  <p className="text-xs text-gray-500">{complaint.reportedByPlate}</p>
                </div>
              </div>
            </div>
          </Card>

          {/* Category Card */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Category</h3>
            <div className="text-center">
              <div className="bg-gray-100 rounded-lg p-4">
                <p className="font-medium text-gray-900 capitalize">
                  {complaint.category.replace('_', ' ')}
                </p>
              </div>
            </div>
          </Card>

          {/* Status Timeline */}
          <Card>
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Complaint Submitted</p>
                  <p className="text-xs text-gray-600">{formatDate(complaint.dateReported)}</p>
                </div>
              </div>
              
              {complaint.status === 'resolved' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Complaint Resolved</p>
                    <p className="text-xs text-gray-600">Recently</p>
                  </div>
                </div>
              )}
              
              {complaint.status === 'rejected' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Complaint Rejected</p>
                    <p className="text-xs text-gray-600">Recently</p>
                  </div>
                </div>
              )}
              
              {complaint.status === 'pending' && (
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Under Review</p>
                    <p className="text-xs text-gray-600">Pending admin action</p>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            {state.currentUser?.userType === 'admin' ? (
              <>
                <Link to="/admin/complaints">
                  <Button variant="outline" className="w-full">
                    View All Complaints
                  </Button>
                </Link>
                <Link to="/admin/submit-complaint">
                  <Button className="w-full">
                    Submit Official Complaint
                  </Button>
                </Link>
              </>
            ) : (
              <>
                <Link to="/my-complaints">
                  <Button variant="outline" className="w-full">
                    View All My Complaints
                  </Button>
                </Link>
                <Link to="/submit-complaint">
                  <Button className="w-full">
                    Submit Another Complaint
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintDetail;
