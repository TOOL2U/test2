import React from 'react';
import { Link } from 'react-router-dom';

const BackOfficePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-3xl font-bold mb-6">Back Office Dashboard</h1>

        {/* Key Metrics Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">Total Orders</h2>
            <p className="text-2xl font-semibold">1,234</p>
          </div>
          <div className="bg-green-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">Active Categories</h2>
            <p className="text-2xl font-semibold">56</p>
          </div>
          <div className="bg-yellow-100 p-4 rounded-lg shadow">
            <h2 className="text-xl font-bold">Staff Members</h2>
            <p className="text-2xl font-semibold">12</p>
          </div>
        </div>

        {/* Recent Activity Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4">Recent Activity</h2>
          <ul className="divide-y divide-gray-200">
            <li className="py-2">Order #1234 was placed by John Doe</li>
            <li className="py-2">Category "Power Tools" was updated</li>
            <li className="py-2">New staff member Jane Smith was added</li>
          </ul>
        </div>

        {/* Navigation Links */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/orders" className="block bg-blue-500 text-white text-center py-3 rounded-lg hover:bg-blue-600">
            Manage Orders
          </Link>
          <Link to="/categories" className="block bg-green-500 text-white text-center py-3 rounded-lg hover:bg-green-600">
            Manage Categories
          </Link>
          <Link to="/staff" className="block bg-yellow-500 text-white text-center py-3 rounded-lg hover:bg-yellow-600">
            Manage Staff
          </Link>
          <Link to="/reports" className="block bg-red-500 text-white text-center py-3 rounded-lg hover:bg-red-600">
            View Reports
          </Link>
        </div>
      </div>
    </div>
  );
};

export default BackOfficePage;
