import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FaClipboardList, FaUsers, FaExclamationTriangle, FaCheckCircle, FaTimesCircle, FaClock, FaPlus, FaFileAlt } from 'react-icons/fa';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useApp } from '../context/AppContext';
import Card from '../components/ui/Card';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import Loading from '../components/ui/Loading';
import DocumentVerification from '../components/admin/DocumentVerification';

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const { state, fetchComplaints } = useApp();
  const { complaints, loading, currentUser } = state;
  
  // Fetch data when component mounts
  useEffect(() => {
    if (currentUser) {
      fetchComplaints();
    }
  }, [currentUser]);
  
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <Loading />
      </div>
    );
  }
  
  const totalComplaints = complaints.length;
  const pendingComplaints = complaints.filter(c => c.status === 'pending');
  const resolvedComplaints = complaints.filter(c => c.status === 'resolved');
  const rejectedComplaints = complaints.filter(c => c.status === 'rejected');
  const highPriorityComplaints = complaints.filter(c => c.priority === 'high');
  
  // Calculate unique users from complaints
  const uniqueUsers = new Set(complaints.map(c => c.reportedBy)).size;

  // Data for charts
  const statusData = [
    { name: 'Pending', value: pendingComplaints.length, color: '#f59e0b' },
    { name: 'Resolved', value: resolvedComplaints.length, color: '#22c55e' },
    { name: 'Rejected', value: rejectedComplaints.length, color: '#ef4444' }
  ];

  const categoryData = complaints.reduce((acc, complaint) => {
    const category = complaint.category.replace('_', ' ');
    const existing = acc.find(item => item.name === category);
    if (existing) {
      existing.count += 1;
    } else {
      acc.push({ name: category, count: 1 });
    }
    return acc;
  }, []);

  const recentComplaints = complaints
    .sort((a, b) => new Date(b.dateReported) - new Date(a.dateReported))
    .slice(0, 5);

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

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-gray-600 mt-2">Traffic Management System Overview</p>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit mb-8">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'overview'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FaClipboardList className="inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('documents')}
          className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            activeTab === 'documents'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <FaFileAlt className="inline mr-2" />
          Document Verification
        </button>
      </div>

      {/* Conditional Content Based on Active Tab */}
      {activeTab === 'overview' ? (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-l-4 border-l-blue-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaClipboardList className="text-2xl text-blue-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{totalComplaints}</p>
                  <p className="text-sm text-gray-600">Total Complaints</p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-yellow-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaClock className="text-2xl text-yellow-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{pendingComplaints.length}</p>
                  <p className="text-sm text-gray-600">Pending Review</p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-red-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaExclamationTriangle className="text-2xl text-red-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{highPriorityComplaints.length}</p>
                  <p className="text-sm text-gray-600">High Priority</p>
                </div>
              </div>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <FaUsers className="text-2xl text-green-600" />
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">{uniqueUsers}</p>
                  <p className="text-sm text-gray-600">Active Users</p>
                </div>
              </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Status Distribution Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaint Status Distribution</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {statusData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* Category Distribution Chart */}
            <Card>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Complaints by Category</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
                </div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recent Complaints */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Complaints</h3>
                <Link to="/admin/complaints">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
              
              <div className="space-y-3">
                {recentComplaints.map(complaint => (
                  <div key={complaint.id} className="border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                      <div className="flex gap-1">
                        <Badge variant={getStatusBadgeVariant(complaint.status)} size="sm">
                          {complaint.status}
                        </Badge>
                        {complaint.submittedBy === 'admin' && (
                          <Badge variant="official" size="sm">
                            Official
                          </Badge>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{complaint.description.substring(0, 100)}...</p>
                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span>By: {complaint.reportedByName}</span>
                      <span>{formatDate(complaint.dateReported)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Priority Complaints */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">High Priority Complaints</h3>
                {highPriorityComplaints.length > 0 && (
                  <Badge variant="high" size="sm">
                    {highPriorityComplaints.length} Active
                  </Badge>
                )}
              </div>
              
              {highPriorityComplaints.length > 0 ? (
                <div className="space-y-3">
                  {highPriorityComplaints.slice(0, 5).map(complaint => (
                    <div key={complaint.id} className="border-l-4 border-l-red-500 bg-red-50 p-3 rounded">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900">{complaint.title}</h4>
                        <Badge variant={getStatusBadgeVariant(complaint.status)} size="sm">
                          {complaint.status}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">
                        Offender: {complaint.offenderPlate} | {complaint.location}
                      </p>
                      <p className="text-xs text-gray-500">
                        Reported by: {complaint.reportedByName} on {formatDate(complaint.dateReported)}
                      </p>
                    </div>
                  ))}
                  <Link to="/admin/complaints">
                    <Button variant="outline" size="sm" className="w-full">
                      View All High Priority
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="text-center py-8">
                  <FaCheckCircle className="text-4xl text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">No high priority complaints at this time</p>
                </div>
              )}
            </Card>
          </div>

          {/* Quick Actions */}
          <Card className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Link to="/admin/submit-complaint">
                <Button className="w-full">
                  <FaPlus className="mr-2" />
                  Submit Official Complaint
                </Button>
              </Link>
              
              <Link to="/admin/complaints">
                <Button variant="outline" className="w-full">
                  <FaClipboardList className="mr-2" />
                  Manage All Complaints
                </Button>
              </Link>
              
              <Button variant="outline" className="w-full">
                <FaUsers className="mr-2" />
                View User Reports
              </Button>
              
              <Button variant="outline" className="w-full">
                <FaExclamationTriangle className="mr-2" />
                Priority Actions Required
              </Button>
            </div>
          </Card>
        </>
      ) : (
        /* Document Verification Tab */
        <DocumentVerification />
      )}
    </div>
  );
};

export default AdminDashboard;
