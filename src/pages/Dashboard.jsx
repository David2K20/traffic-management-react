import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaList, FaFileAlt, FaExclamationTriangle, FaBell } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import DocumentUpload from '../components/ui/DocumentUpload';

const Dashboard = () => {
  const { state, getComplaintsByUser, getComplaintsAgainstUser, getDocumentsByUser, fetchComplaints, fetchDocuments } = useApp();
  const { currentUser, loading } = state;
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  
  // Fetch data when component mounts or user changes
  useEffect(() => {
    if (currentUser) {
      fetchComplaints();
      fetchDocuments(currentUser.id);
    }
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loading />
      </div>
    );
  }
  
  const userComplaints = getComplaintsByUser(currentUser?.id);
  const complaintsAgainstUser = getComplaintsAgainstUser(currentUser?.vehiclePlate);
  const userDocuments = getDocumentsByUser(currentUser?.id);
  
  const pendingComplaints = userComplaints.filter(c => c.status === 'pending');
  const expiredDocuments = userDocuments.filter(doc => {
    const today = new Date();
    const expiry = new Date(doc.expiryDate);
    return expiry < today;
  });
  
  const expiringDocuments = userDocuments.filter(doc => {
    const today = new Date();
    const expiry = new Date(doc.expiryDate);
    const daysUntilExpiry = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser?.fullName}!</h1>
        <p className="text-gray-600 mt-2">Vehicle Plate: <span className="font-semibold">{currentUser?.vehiclePlate}</span></p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Link to="/submit-complaint">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaPlus className="text-2xl text-blue-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">Submit Complaint</h3>
                <p className="text-sm text-gray-600">Report a traffic violation</p>
              </div>
            </div>
          </Card>
        </Link>

        <Link to="/my-complaints">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaList className="text-2xl text-green-600" />
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-medium text-gray-900">My Complaints</h3>
                <p className="text-sm text-gray-600">View submitted complaints</p>
              </div>
            </div>
          </Card>
        </Link>

        <Card className="border-l-4 border-l-yellow-500">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FaFileAlt className="text-2xl text-yellow-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
              <p className="text-sm text-gray-600">{userDocuments.length} uploaded</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userComplaints.length}</div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingComplaints.length}</div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{complaintsAgainstUser.length}</div>
            <div className="text-sm text-gray-600">Against Me</div>
          </div>
        </Card>
        
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{userDocuments.length}</div>
            <div className="text-sm text-gray-600">Documents</div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Complaints */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Complaints</h3>
            <Link to="/my-complaints">
              <Button variant="outline" size="sm">View All</Button>
            </Link>
          </div>
          
          {userComplaints.slice(0, 3).length > 0 ? (
            <div className="space-y-3">
              {userComplaints.slice(0, 3).map(complaint => (
                <div key={complaint.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{complaint.title}</p>
                    <p className="text-sm text-gray-600">Against: {complaint.offenderPlate}</p>
                  </div>
                  <Badge variant={complaint.status}>{complaint.status}</Badge>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-600 text-center py-4">No complaints submitted yet</p>
          )}
        </Card>

        {/* Notifications */}
        <Card>
          <div className="flex items-center mb-4">
            <FaBell className="text-yellow-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
          </div>
          
          {/* Document Expiry Alerts */}
          {expiredDocuments.length > 0 && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Expired Documents</span>
                </div>
                <div className="mt-2 space-y-1">
                  {expiredDocuments.map(doc => (
                    <p key={doc.id} className="text-sm text-red-700">
                      {doc.name} expired on {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {expiringDocuments.length > 0 && (
            <div className="mb-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-yellow-600 mr-2" />
                  <span className="font-medium text-yellow-800">Documents Expiring Soon</span>
                </div>
                <div className="mt-2 space-y-1">
                  {expiringDocuments.map(doc => {
                    const daysLeft = Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24));
                    return (
                      <p key={doc.id} className="text-sm text-yellow-700">
                        {doc.name} expires in {daysLeft} days
                      </p>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* Complaints Against User */}
          {complaintsAgainstUser.length > 0 && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaExclamationTriangle className="text-red-600 mr-2" />
                  <span className="font-medium text-red-800">Complaints Against You</span>
                </div>
                <div className="mt-2 space-y-1">
                  {complaintsAgainstUser.slice(0, 2).map(complaint => (
                    <p key={complaint.id} className="text-sm text-red-700">
                      {complaint.title} - {complaint.category}
                    </p>
                  ))}
                </div>
              </div>
            </div>
          )}

          {expiredDocuments.length === 0 && expiringDocuments.length === 0 && complaintsAgainstUser.length === 0 && (
            <p className="text-gray-600 text-center py-4">No notifications at this time</p>
          )}
        </Card>
      </div>

      {/* Document Upload Section */}
      <Card className="mt-8">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Management</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {['license', 'roadworthiness', 'insurance'].map(docType => {
            const doc = userDocuments.find(d => d.type === docType);
            const isExpired = doc && new Date(doc.expiryDate) < new Date();
            const isExpiring = doc && !isExpired && Math.ceil((new Date(doc.expiryDate) - new Date()) / (1000 * 60 * 60 * 24)) <= 30;
            
            return (
              <div key={docType} className="border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium capitalize mb-2">
                  {docType === 'license' ? "Driver's License" : 
                   docType === 'roadworthiness' ? 'Road Worthiness' : 
                   'Insurance Certificate'}
                </h4>
                {doc ? (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">
                      Expires: {new Date(doc.expiryDate).toLocaleDateString()}
                    </p>
                    <Badge 
                      variant={isExpired ? 'rejected' : isExpiring ? 'pending' : 'resolved'}
                      size="sm"
                    >
                      {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid'}
                    </Badge>
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Not uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDocumentType(docType);
                        setShowDocumentUpload(true);
                      }}
                    >
                      Upload
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Document Upload Modal */}
      <DocumentUpload
        documentType={selectedDocumentType}
        isOpen={showDocumentUpload}
        onClose={() => {
          setShowDocumentUpload(false);
          setSelectedDocumentType(null);
        }}
        onSuccess={(document) => {
          // Refresh documents after successful upload
          fetchDocuments(currentUser.id);
        }}
      />
    </div>
  );
};

export default Dashboard;
