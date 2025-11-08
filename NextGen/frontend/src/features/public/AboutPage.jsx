import { Link } from 'react-router-dom'
import { BookOpen, Users, GraduationCap, Award } from 'lucide-react'

export default function AboutPage() {
  const features = [
    {
      icon: <GraduationCap className="w-8 h-8 text-blue-600" />,
      title: 'Quality Education',
      description: 'Providing excellence in education with modern teaching methodologies and experienced faculty.'
    },
    {
      icon: <Users className="w-8 h-8 text-blue-600" />,
      title: 'Community Learning',
      description: 'Foster collaboration and knowledge sharing through our social learning platform.'
    },
    {
      icon: <BookOpen className="w-8 h-8 text-blue-600" />,
      title: 'Digital Resources',
      description: 'Access comprehensive study materials, quizzes, and interactive learning content.'
    },
    {
      icon: <Award className="w-8 h-8 text-blue-600" />,
      title: 'Student Success',
      description: 'Track progress, earn certificates, and achieve academic excellence with our tools.'
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6">About Chronicle College</h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Empowering students through innovative technology and quality education in a collaborative environment.
            </p>
          </div>
        </div>
      </div>

      {/* Mission Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">Our Mission</h2>
            <p className="text-lg text-gray-700 mb-4">
              Chronicle College Social Network is designed to revolutionize the way students learn and collaborate.
              We believe in creating a connected learning environment where knowledge flows freely and students
              can grow together.
            </p>
            <p className="text-lg text-gray-700 mb-4">
              Our platform combines traditional academic excellence with modern technology to provide students
              with everything they need to succeed in their educational journey.
            </p>
            <p className="text-lg text-gray-700">
              We're committed to providing a secure, user-friendly platform that enhances the learning experience
              for students, faculty, and administrators alike.
            </p>
          </div>
          <div className="bg-blue-50 rounded-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Key Statistics</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Active Students</span>
                <span className="text-2xl font-bold text-blue-600">10,000+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Courses Offered</span>
                <span className="text-2xl font-bold text-blue-600">50+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Faculty Members</span>
                <span className="text-2xl font-bold text-blue-600">200+</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Study Materials</span>
                <span className="text-2xl font-bold text-blue-600">5,000+</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">What We Offer</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Comprehensive features designed to enhance your learning experience
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-gray-50 rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Platform Features */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Platform Features</h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Students</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Access study materials and resources</li>
              <li>• Take quizzes and track your progress</li>
              <li>• Participate in discussions and forums</li>
              <li>• Connect with classmates through chat</li>
              <li>• View notices and announcements</li>
              <li>• Manage your profile and certificates</li>
              <li>• Share updates on your timeline</li>
            </ul>
          </div>
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-3">For Faculty</h3>
            <ul className="space-y-2 text-gray-700">
              <li>• Upload and manage study materials</li>
              <li>• Create and grade quizzes</li>
              <li>• Post notices and announcements</li>
              <li>• Monitor student progress</li>
              <li>• Issue certificates to students</li>
              <li>• Manage courses and subjects</li>
              <li>• Analytics and reporting tools</li>
            </ul>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold mb-6">Join Chronicle College Today</h2>
          <p className="text-xl text-blue-100 mb-8">
            Experience the future of education with our modern learning platform
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/register"
              className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-gray-100 transition-colors font-medium"
            >
              Register Now
            </Link>
            <Link
              to="/login"
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-400 transition-colors font-medium border-2 border-white"
            >
              Student Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
