import { Link } from 'react-router-dom'
import { Home, ArrowLeft, Search } from 'lucide-react'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <h1 className="text-[150px] md:text-[200px] font-bold text-blue-600 leading-none">
            404
          </h1>
          <div className="relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <Search className="w-24 h-24 text-blue-300 opacity-20" />
            </div>
          </div>
        </div>

        {/* Message */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Oops! Page Not Found
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
            Don't worry, it happens to the best of us!
          </p>

          {/* Suggestions */}
          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">Here's what you can do:</h3>
            <ul className="text-left text-gray-700 space-y-2">
              <li>• Double-check the URL for typos</li>
              <li>• Go back to the previous page</li>
              <li>• Visit our homepage and start fresh</li>
              <li>• Use the search feature to find what you're looking for</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              <Home className="w-5 h-5" />
              Go to Homepage
            </Link>
            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="font-semibold text-gray-900 mb-4">Popular Pages</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link
              to="/login"
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              Login
            </Link>
            <Link
              to="/register"
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              Register
            </Link>
            <Link
              to="/about"
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              About Us
            </Link>
            <Link
              to="/contact"
              className="text-blue-600 hover:text-blue-700 hover:underline text-sm"
            >
              Contact
            </Link>
          </div>
        </div>

        {/* Footer Text */}
        <p className="mt-8 text-gray-600 text-sm">
          If you believe this is an error, please{' '}
          <Link to="/contact" className="text-blue-600 hover:underline">
            contact support
          </Link>
        </p>
      </div>
    </div>
  )
}
