import React from 'react';
import { Link } from 'react-router-dom';

const BackOfficePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto bg-white shadow-md rounded-lg p-6">
        <h1 className="text-2xl font-bold mb-4">Back Office Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome to the back office. Use the links below to manage the system.</p>

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