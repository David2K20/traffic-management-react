import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaList, FaFileAlt, FaExclamationTriangle, FaBell, FaUpload } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import { DOCUMENT_STATUS } from '../lib/supabase';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import DocumentUpload from '../components/ui/DocumentUpload';
import { formatDate, formatTime, getDaysUntilExpiry } from '../utils/dateUtils';

const Dashboard = () => {
  const { state, getComplaintsByUser, getComplaintsAgainstUser, getDocumentsByUser, fetchComplaints, fetchDocuments, showError, showWarning, showSuccess } = useApp();
  const { currentUser, loading } = state;
  const [showDocumentUpload, setShowDocumentUpload] = useState(false);
  const [selectedDocumentType, setSelectedDocumentType] = useState(null);
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const [lastFetchTime, setLastFetchTime] = useState(null);
  const hasDataBeenFetched = useRef(false);
  const lastAuthStateRef = useRef(null);
  
  // Fetch data with retry logic
  const fetchDashboardData = async (isRetry = false, retryAttempt = 0) => {
    if (!currentUser?.id) return;
    
    setDataLoading(true);
    setDataError(null);
    
    try {
      console.log(`Fetching dashboard data (attempt ${retryAttempt + 1})...`);
      
      // Set timeout for data fetching (30 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), 30000);
      });
      
      const fetchPromises = [
        fetchComplaints(),
        fetchDocuments(currentUser.id)
      ];
      
      // Race between data fetching and timeout
      await Promise.race([
        Promise.allSettled(fetchPromises),
        timeoutPromise
      ]);
      
      setLastFetchTime(Date.now());
      setRetryCount(0);
      setDataError(null);
      
      if (isRetry) {
        showWarning('Dashboard data refreshed successfully');
      }
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      const errorMessage = error.message === 'Request timeout' 
        ? 'Request timed out. Please check your connection.' 
        : 'Failed to load dashboard data';
      
      setDataError(errorMessage);
      
      if (retryAttempt < 2) {
        const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000);
        console.log(`Retrying dashboard data fetch in ${retryDelay}ms...`);
        
        setTimeout(() => {
          fetchDashboardData(true, retryAttempt + 1);
        }, retryDelay);
      } else {
        showError(errorMessage + '. Please try refreshing manually.');
        setRetryCount(retryAttempt + 1);
      }
    } finally {
      setDataLoading(false);
    }
  };
  
  // Fetch data only when truly necessary - improved to prevent token refresh triggered fetches
  useEffect(() => {
    let isMounted = true;
    
    const { isAuthRestored, authInitialized } = state;
    
    // Create a stable reference for the current auth state (excluding timestamp changes)
    const currentAuthState = `${isAuthRestored}_${authInitialized}_${currentUser?.id}`;
    
    // Only proceed if auth is complete and we have a user
    if (isAuthRestored && authInitialized && currentUser?.id) {
      // Check if we need to fetch data with more restrictive conditions
      const shouldFetch = 
        !hasDataBeenFetched.current && // Never fetched before
        (state.complaints.length === 0 || state.documents.length === 0); // AND no data loaded
      
      // CRITICAL FIX: Don't fetch data on auth state changes after initial load
      // This prevents the auto-refresh behavior when token refreshes occur
      const isInitialLoad = !hasDataBeenFetched.current;
      
      if (shouldFetch && isMounted && isInitialLoad) {
        console.log('Initial dashboard data fetch - auth complete and user available');
        hasDataBeenFetched.current = true;
        lastAuthStateRef.current = currentAuthState;
        
        fetchDashboardData().catch(error => {
          console.error('Dashboard data fetch failed:', error);
          // Reset hasDataBeenFetched on error to allow retry
          hasDataBeenFetched.current = false;
        });
      } else if (!shouldFetch) {
        console.log('Skipping dashboard data fetch - data already loaded or not initial load');
        // Still update the reference to track state changes
        lastAuthStateRef.current = currentAuthState;
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, [state.isAuthRestored, state.authInitialized, currentUser?.id]); // REMOVED state.complaints.length, state.documents.length from dependencies
  
  // Manual refresh function
  const handleManualRefresh = () => {
    setRetryCount(0);
    fetchDashboardData(true, 0);
  };
  
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
  
  const rejectedDocuments = userDocuments.filter(doc => doc.status === DOCUMENT_STATUS.REJECTED);
  const pendingDocuments = userDocuments.filter(doc => doc.status === DOCUMENT_STATUS.PENDING || !doc.status);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Welcome back, {currentUser?.fullName}!</h1>
            <p className="text-gray-600 mt-2">Vehicle Plate: <span className="font-semibold">{currentUser?.vehiclePlate}</span></p>
            {lastFetchTime && (
              <p className="text-xs text-gray-500 mt-1">
                Last updated: {formatTime(lastFetchTime)}
              </p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            {dataLoading && (
              <div className="flex items-center text-blue-600">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                <span className="text-sm">Loading...</span>
              </div>
            )}
            <Button 
              onClick={handleManualRefresh} 
              variant="outline" 
              size="sm"
              disabled={dataLoading}
            >
              Refresh
            </Button>
          </div>
        </div>
        
        {/* Data Error Display */}
        {dataError && retryCount > 2 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <FaExclamationTriangle className="text-red-600 mr-2" />
                <span className="text-sm text-red-800">{dataError}</span>
              </div>
              <Button 
                onClick={handleManualRefresh} 
                variant="outline" 
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
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
                      {doc.name} expired on {formatDate(doc.expiryDate)}
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

          {/* Rejected Documents */}
          {rejectedDocuments.length > 0 && (
            <div className="mb-4">
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <FaExclamationTriangle className="text-red-600 mr-2" />
                    <span className="font-medium text-red-800">Documents Rejected</span>
                  </div>
                  <div className="flex items-center text-blue-600">
                    <FaUpload className="mr-1" size={12} />
                    <span className="text-xs font-medium">Click to re-upload</span>
                  </div>
                </div>
                <div className="mt-3 space-y-2">
                  {rejectedDocuments.map(doc => (
                    <div key={doc.id} className="flex items-center justify-between p-2 bg-white rounded border border-red-100">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-red-700">{doc.name}</p>
                        <p className="text-xs text-red-600">{doc.rejectionReason || 'Please contact admin'}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-colors duration-200 flex items-center ml-2"
                        onClick={() => {
                          setSelectedDocumentType(doc.type);
                          setSelectedDocument(doc);
                          setShowDocumentUpload(true);
                        }}
                        title={`Upload new ${doc.name.toLowerCase()}`}
                      >
                        <FaUpload className="mr-1" size={10} />
                        Re-upload
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Pending Documents */}
          {pendingDocuments.length > 0 && (
            <div className="mb-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="flex items-center">
                  <FaBell className="text-blue-600 mr-2" />
                  <span className="font-medium text-blue-800">Documents Under Review</span>
                </div>
                <div className="mt-2 space-y-1">
                  {pendingDocuments.map(doc => (
                    <p key={doc.id} className="text-sm text-blue-700">
                      {doc.name} is being reviewed by our team
                    </p>
                  ))}
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

          {expiredDocuments.length === 0 && expiringDocuments.length === 0 && complaintsAgainstUser.length === 0 && rejectedDocuments.length === 0 && pendingDocuments.length === 0 && (
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
                      Expires: {formatDate(doc.expiryDate)}
                    </p>
                    
                    {/* Document Expiry Status */}
                    <div className="mb-2">
                      <Badge 
                        variant={isExpired ? 'rejected' : isExpiring ? 'pending' : 'resolved'}
                        size="sm"
                      >
                        {isExpired ? 'Expired' : isExpiring ? 'Expiring Soon' : 'Valid'}
                      </Badge>
                    </div>
                    
                    {/* Document Verification Status */}
                    <div className="mb-2">
                      <p className="text-xs text-gray-500 mb-1">Verification Status:</p>
                      <div className="flex items-center justify-between">
                        <Badge 
                          variant={
                            doc.status === DOCUMENT_STATUS.APPROVED ? 'resolved' : 
                            doc.status === DOCUMENT_STATUS.REJECTED ? 'rejected' : 
                            'pending'
                          }
                          size="sm"
                        >
                          {doc.status || 'Pending'}
                        </Badge>
                        
                        {/* Re-upload button for rejected documents */}
                        {doc.status === DOCUMENT_STATUS.REJECTED && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 border-blue-600 hover:bg-blue-50 hover:border-blue-700 transition-colors duration-200 flex items-center ml-2"
                            onClick={() => {
                              setSelectedDocumentType(docType);
                              setSelectedDocument(doc); // Pass the existing document
                              setShowDocumentUpload(true);
                            }}
                            title="Upload new document to replace the rejected one"
                          >
                            <FaUpload className="mr-1" size={12} />
                            Upload New
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Rejection Reason */}
                    {doc.status === DOCUMENT_STATUS.REJECTED && doc.rejectionReason && (
                      <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                        <p className="text-xs text-red-600 font-medium mb-1">Reason for rejection:</p>
                        <p className="text-xs text-red-700">{doc.rejectionReason}</p>
                        <div className="flex items-center mt-2">
                          <FaUpload className="text-blue-600 mr-1" size={10} />
                          <p className="text-xs text-blue-600 font-medium">Click "Upload New" button above to submit a replacement</p>
                        </div>
                      </div>
                    )}
                    
                    {/* Upload Date */}
                    {doc.uploadDate && (
                      <p className="text-xs text-gray-500 mt-2">
                        Uploaded: {formatDate(doc.uploadDate)}
                      </p>
                    )}
                  </div>
                ) : (
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Not uploaded</p>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setSelectedDocumentType(docType);
                        setSelectedDocument(null); // No existing document for new uploads
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
        isReUpload={!!selectedDocument} // Pass true if we have an existing document
        existingDocument={selectedDocument} // Pass the existing document for replacement
        onClose={() => {
          setShowDocumentUpload(false);
          setSelectedDocumentType(null);
          setSelectedDocument(null);
        }}
        onSuccess={(document) => {
          // Refresh documents after successful upload
          fetchDocuments(currentUser.id);
          
          // Show additional feedback for replacements
          if (selectedDocument) {
            showSuccess('Document successfully replaced and sent for review!');
          }
        }}
      />
    </div>
  );
};

export default Dashboard;
