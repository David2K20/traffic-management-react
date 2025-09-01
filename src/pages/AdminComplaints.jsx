import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaEye, FaEdit, FaSearch, FaFilter, FaPlus } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';
import Modal from '../components/ui/Modal';

const AdminComplaints = () => {
  const { state, updateComplaint } = useApp();
  const { complaints } = state;
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: '',
    adminComments: ''
  });

  // Filter complaints
  const filteredComplaints = complaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.offenderPlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.reportedByName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    const matchesCategory = categoryFilter === 'all' || complaint.category === categoryFilter;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  // Sort by date (newest first) and priority
  const sortedComplaints = filteredComplaints.sort((a, b) => {
    // First sort by priority (high first)
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    // Then by date (newest first)
    return new Date(b.dateReported) - new Date(a.dateReported);
  });

  const categories = [...new Set(complaints.map(c => c.category))];

  const openUpdateModal = (complaint) => {
    setSelectedComplaint(complaint);
    setUpdateData({
      status: complaint.status,
      adminComments: complaint.adminComments || ''
    });
    setIsModalOpen(true);
  };

  const handleUpdateComplaint = () => {
    if (selectedComplaint) {
      updateComplaint(selectedComplaint.id, updateData);
      setIsModalOpen(false);
      setSelectedComplaint(null);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">All Complaints</h1>
        <p className="text-gray-600 mt-2">Manage and review all traffic violation complaints</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{complaints.length}</div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {complaints.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {complaints.filter(c => c.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {complaints.filter(c => c.priority === 'high').length}
            </div>
            <div className="text-sm text-gray-600">High Priority</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search complaints..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="resolved">Resolved</option>
            <option value="rejected">Rejected</option>
          </select>
          
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Priority</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Categories</option>
            {categories.map(category => (
              <option key={category} value={category}>
                {category.replace('_', ' ')}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {sortedComplaints.length > 0 ? (
          sortedComplaints.map(complaint => (
            <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                      <p className="text-sm text-gray-600">ID: #{complaint.id}</p>
                    </div>
                    <div className="flex flex-wrap gap-2 ml-4">
                      <Badge variant={getStatusBadgeVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                      {complaint.submittedBy === 'admin' && (
                        <Badge variant="official" size="sm">
                          Official
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <p className="text-gray-700 mb-3">{complaint.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                      <p><strong>Offender:</strong> {complaint.offenderPlate}</p>
                      <p><strong>Location:</strong> {complaint.location}</p>
                    </div>
                    <div>
                      <p><strong>Reported by:</strong> {complaint.reportedByName} ({complaint.reportedByPlate})</p>
                      <p><strong>Date:</strong> {formatDate(complaint.dateReported)}</p>
                    </div>
                  </div>
                  
                  {complaint.adminComments && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Admin Comments:</strong> {complaint.adminComments}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 lg:mt-0 lg:ml-6 flex flex-col space-y-2 lg:w-32">
                  <Link to={`/complaint/${complaint.id}`}>
                    <Button variant="outline" size="sm" className="w-full">
                      <FaEye className="mr-2" />
                      View
                    </Button>
                  </Link>
                  <Button 
                    variant="primary" 
                    size="sm" 
                    className="w-full"
                    onClick={() => openUpdateModal(complaint)}
                  >
                    <FaEdit className="mr-2" />
                    Update
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <FaFilter className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600">No complaints match your current filters</p>
            </div>
          </Card>
        )}
      </div>

      {/* Update Complaint Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Update Complaint Status"
        size="md"
      >
        {selectedComplaint && (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">{selectedComplaint.title}</h4>
              <p className="text-sm text-gray-600">Complaint ID: #{selectedComplaint.id}</p>
            </div>
            
            <FormInput
              label="Status"
              type="select"
              value={updateData.status}
              onChange={(e) => setUpdateData(prev => ({ ...prev, status: e.target.value }))}
              required
            >
              <option value="pending">Pending</option>
              <option value="resolved">Resolved</option>
              <option value="rejected">Rejected</option>
            </FormInput>
            
            <FormInput
              label="Admin Comments"
              type="textarea"
              rows="4"
              value={updateData.adminComments}
              onChange={(e) => setUpdateData(prev => ({ ...prev, adminComments: e.target.value }))}
              placeholder="Add comments about this complaint..."
            />
            
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={() => setIsModalOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleUpdateComplaint}
                className="flex-1"
              >
                Update Complaint
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminComplaints;
