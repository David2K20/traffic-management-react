import React, { useState, useEffect } from 'react';
import { FaEye, FaCheck, FaTimes, FaSpinner, FaFileAlt, FaUser, FaCar, FaCalendar } from 'react-icons/fa';
import { useApp } from '../../context/AppContext';
import { DOCUMENT_STATUS } from '../../lib/supabase';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import Modal from '../ui/Modal';
import { formatDate } from '../../utils/dateUtils';

const DocumentVerification = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [loadRetryCount, setLoadRetryCount] = useState(0);
  const [isLoadRetrying, setIsLoadRetrying] = useState(false);
  
  const { fetchAllDocuments, updateDocumentStatus, showSuccess, showError, showWarning } = useApp();

  useEffect(() => {
    loadDocuments();
  }, []);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const result = await fetchAllDocuments();
      if (result.success) {
        setDocuments(result.documents);
      } else {
        console.error('Error loading documents:', result.message);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredDocuments = documents.filter(doc => {
    if (filter === 'all') return true;
    return doc.status === filter;
  });

  const handleApprove = async (documentId) => {
    setActionLoading(true);
    setRetryCount(0);
    
    const attemptApproval = async (attempt = 1) => {
      try {
        const result = await Promise.race([
          updateDocumentStatus(documentId, DOCUMENT_STATUS.APPROVED),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Approval timeout')), 30000)
          )
        ]);
        
        if (result.success) {
          await loadDocuments(); // Refresh the list
          showSuccess('Document approved successfully!');
        } else {
          throw new Error(result.message || 'Failed to approve document');
        }
      } catch (error) {
        console.error(`Error approving document (attempt ${attempt}):`, error);
        
        if (attempt < 3) {
          // Retry with exponential backoff
          const backoffTime = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
          setRetryCount(attempt);
          setIsRetrying(true);
          
          showWarning(`Approval failed. Retrying in ${backoffTime/1000} seconds...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return attemptApproval(attempt + 1);
        } else {
          // All retry attempts failed
          const errorMessage = 'Failed to approve after multiple attempts. Please try again later.';
          showError(errorMessage);
          throw error;
        }
      } finally {
        if (attempt === 3 || !isRetrying) {
          setActionLoading(false);
          setIsRetrying(false);
        }
      }
    };
    
    try {
      await attemptApproval();
    } catch (error) {
      // Final error already handled in the attemptApproval function
      console.error('Approval ultimately failed:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedDocument || !rejectionReason.trim()) {
      showWarning('Please provide a rejection reason.');
      return;
    }

    setActionLoading(true);
    setRetryCount(0);
    
    const attemptRejection = async (attempt = 1) => {
      try {
        const result = await Promise.race([
          updateDocumentStatus(
            selectedDocument.id, 
            DOCUMENT_STATUS.REJECTED, 
            rejectionReason
          ),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Rejection timeout')), 30000)
          )
        ]);
        
        if (result.success) {
          await loadDocuments(); // Refresh the list
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedDocument(null);
          showSuccess('Document rejected successfully!');
        } else {
          throw new Error(result.message || 'Failed to reject document');
        }
      } catch (error) {
        console.error(`Error rejecting document (attempt ${attempt}):`, error);
        
        if (attempt < 3) {
          // Retry with exponential backoff
          const backoffTime = Math.min(2000 * Math.pow(2, attempt - 1), 8000);
          setRetryCount(attempt);
          setIsRetrying(true);
          
          showWarning(`Rejection failed. Retrying in ${backoffTime/1000} seconds...`);
          
          await new Promise(resolve => setTimeout(resolve, backoffTime));
          return attemptRejection(attempt + 1);
        } else {
          // All retry attempts failed
          const errorMessage = 'Failed to reject after multiple attempts. Please try again later.';
          showError(errorMessage);
          throw error;
        }
      } finally {
        if (attempt === 3 || !isRetrying) {
          setActionLoading(false);
          setIsRetrying(false);
        }
      }
    };
    
    try {
      await attemptRejection();
    } catch (error) {
      // Final error already handled in the attemptRejection function
      console.error('Rejection ultimately failed:', error);
    }
  };

  const openDocument = (fileUrl) => {
    window.open(fileUrl, '_blank');
  };

  const getStatusBadgeVariant = (status) => {
    switch (status) {
      case DOCUMENT_STATUS.APPROVED:
        return 'resolved';
      case DOCUMENT_STATUS.REJECTED:
        return 'rejected';
      case DOCUMENT_STATUS.PENDING:
      default:
        return 'pending';
    }
  };

  const pendingCount = documents.filter(doc => doc.status === DOCUMENT_STATUS.PENDING).length;
  const approvedCount = documents.filter(doc => doc.status === DOCUMENT_STATUS.APPROVED).length;
  const rejectedCount = documents.filter(doc => doc.status === DOCUMENT_STATUS.REJECTED).length;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <FaSpinner className="animate-spin text-2xl text-blue-600" />
        <span className="ml-2">Loading documents...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Document Verification</h2>
        <Button onClick={loadDocuments} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{documents.length}</div>
            <div className="text-sm text-gray-600">Total Documents</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">{pendingCount}</div>
            <div className="text-sm text-gray-600">Pending Review</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">{approvedCount}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">{rejectedCount}</div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
      </div>

      {/* Filter Tabs */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
        {[
          { key: 'all', label: 'All', count: documents.length },
          { key: 'pending', label: 'Pending', count: pendingCount },
          { key: 'approved', label: 'Approved', count: approvedCount },
          { key: 'rejected', label: 'Rejected', count: rejectedCount }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              filter === tab.key
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Documents Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User & Document
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Vehicle Plate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Expiry Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredDocuments.length > 0 ? (
                filteredDocuments.map(document => (
                  <tr key={document.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaFileAlt className="text-blue-600 mr-3" />
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {document.userName}
                          </div>
                          <div className="text-sm text-gray-500">
                            {document.name}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCar className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{document.userPlate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FaCalendar className="text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">
                          {formatDate(document.uploadDate)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {formatDate(document.expiryDate)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge variant={getStatusBadgeVariant(document.status)} size="sm">
                        {document.status?.charAt(0).toUpperCase() + document.status?.slice(1)}
                      </Badge>
                      {document.rejectionReason && (
                        <div className="text-xs text-red-600 mt-1 max-w-xs truncate">
                          {document.rejectionReason}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <Button
                        onClick={() => openDocument(document.fileUrl)}
                        variant="outline"
                        size="sm"
                        title="View Document"
                      >
                        <FaEye />
                      </Button>
                      
                      {document.status === DOCUMENT_STATUS.PENDING && (
                        <>
                          <Button
                            onClick={() => handleApprove(document.id)}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            className="text-green-600 hover:text-green-700 hover:border-green-600"
                            title="Approve Document"
                          >
                            <FaCheck />
                          </Button>
                          <Button
                            onClick={() => {
                              setSelectedDocument(document);
                              setShowRejectModal(true);
                            }}
                            variant="outline"
                            size="sm"
                            disabled={actionLoading}
                            className="text-red-600 hover:text-red-700 hover:border-red-600"
                            title="Reject Document"
                          >
                            <FaTimes />
                          </Button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                    {filter === 'all' ? 'No documents uploaded yet' : `No ${filter} documents`}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Rejection Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setRejectionReason('');
          setSelectedDocument(null);
        }}
        title="Reject Document"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            Please provide a reason for rejecting this document:
          </p>
          <p className="font-medium text-gray-900">
            {selectedDocument?.name} - {selectedDocument?.userName}
          </p>
          
          <textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            rows="4"
            required
          />
          
          <div className="flex space-x-3">
            <Button
              onClick={() => {
                setShowRejectModal(false);
                setRejectionReason('');
                setSelectedDocument(null);
              }}
              variant="outline"
              className="flex-1"
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              className="flex-1 bg-red-600 hover:bg-red-700 flex items-center justify-center"
              disabled={actionLoading || !rejectionReason.trim()}
            >
              {actionLoading && (
                <FaSpinner className="animate-spin mr-2" />
              )}
              {actionLoading 
                ? (isRetrying ? `Retrying (${retryCount}/3)...` : 'Rejecting...')
                : 'Reject Document'
              }
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default DocumentVerification;
