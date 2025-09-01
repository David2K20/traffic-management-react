import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaPlus, FaEye, FaFilter, FaSearch } from 'react-icons/fa';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import FormInput from '../components/ui/FormInput';

const MyComplaints = () => {
  const { state, getComplaintsByUser } = useApp();
  const { currentUser } = state;
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  
  const userComplaints = getComplaintsByUser(currentUser?.id);
  
  // Filter complaints based on search and filters
  const filteredComplaints = userComplaints.filter(complaint => {
    const matchesSearch = complaint.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         complaint.offenderPlate.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || complaint.status === statusFilter;
    const matchesPriority = priorityFilter === 'all' || complaint.priority === priorityFilter;
    
    return matchesSearch && matchesStatus && matchesPriority;
  });

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
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Complaints</h1>
          <p className="text-gray-600 mt-2">Track all your submitted complaints</p>
        </div>
        <Link to="/submit-complaint">
          <Button className="mt-4 md:mt-0">
            <FaPlus className="mr-2" />
            Submit New Complaint
          </Button>
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{userComplaints.length}</div>
            <div className="text-sm text-gray-600">Total Complaints</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">
              {userComplaints.filter(c => c.status === 'pending').length}
            </div>
            <div className="text-sm text-gray-600">Pending</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">
              {userComplaints.filter(c => c.status === 'resolved').length}
            </div>
            <div className="text-sm text-gray-600">Resolved</div>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600">
              {userComplaints.filter(c => c.status === 'rejected').length}
            </div>
            <div className="text-sm text-gray-600">Rejected</div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
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
          </div>
          
          <div className="flex gap-4">
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
          </div>
        </div>
      </Card>

      {/* Complaints List */}
      <div className="space-y-4">
        {filteredComplaints.length > 0 ? (
          filteredComplaints.map(complaint => (
            <Card key={complaint.id} className="hover:shadow-lg transition-shadow">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between">
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{complaint.title}</h3>
                    <div className="flex space-x-2 ml-4">
                      <Badge variant={getStatusBadgeVariant(complaint.status)}>
                        {complaint.status}
                      </Badge>
                      <Badge variant={getPriorityBadgeVariant(complaint.priority)}>
                        {complaint.priority}
                      </Badge>
                    </div>
                  </div>
                  
                  <p className="text-gray-600 mb-2">{complaint.description}</p>
                  
                  <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                    <span><strong>Against:</strong> {complaint.offenderPlate}</span>
                    <span><strong>Location:</strong> {complaint.location}</span>
                    <span><strong>Category:</strong> {complaint.category.replace('_', ' ')}</span>
                    <span><strong>Date:</strong> {formatDate(complaint.dateReported)}</span>
                  </div>
                  
                  {complaint.adminComments && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Admin Response:</strong> {complaint.adminComments}
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="mt-4 md:mt-0 md:ml-4">
                  <Link to={`/complaint/${complaint.id}`}>
                    <Button variant="outline" size="sm">
                      <FaEye className="mr-2" />
                      View Details
                    </Button>
                  </Link>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card>
            <div className="text-center py-12">
              <FaFilter className="text-4xl text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No complaints found</h3>
              <p className="text-gray-600 mb-4">
                {userComplaints.length === 0 
                  ? "You haven't submitted any complaints yet" 
                  : "No complaints match your current filters"}
              </p>
              {userComplaints.length === 0 && (
                <Link to="/submit-complaint">
                  <Button>
                    <FaPlus className="mr-2" />
                    Submit Your First Complaint
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default MyComplaints;
