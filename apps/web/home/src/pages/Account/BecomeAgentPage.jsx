// src/pages/Account/BecomeAgentPage.jsx
import { Building, Target, Users, TrendingUp, Briefcase, Award } from 'lucide-react';
import { useState } from 'react';

export default function BecomeAgentPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    experience: '',
    license: '',
    bio: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Agent application submitted:', formData);
    // Handle form submission
  };

  const stats = [
    { label: 'Active Agents', value: '2,500+', icon: <Users className="w-6 h-6" /> },
    { label: 'Properties Sold', value: '$5.2B', icon: <TrendingUp className="w-6 h-6" /> },
    { label: 'Success Rate', value: '98%', icon: <Target className="w-6 h-6" /> },
    { label: 'Avg. Commission', value: '15%', icon: <Award className="w-6 h-6" /> },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-600 rounded-full mb-6">
            <Building className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Become a Real Estate Agent</h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Join our elite network of real estate professionals. Access exclusive listings, premium clients, 
            and advanced tools to grow your business.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, index) => (
            <div key={index} className="bg-white p-6 rounded-xl shadow-lg border border-gray-200 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mb-4">
                <div className="text-blue-600">
                  {stat.icon}
                </div>
              </div>
              <div className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</div>
              <div className="text-sm text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Left Column - Benefits */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-8">Agent Benefits</h2>
            <div className="space-y-6">
              <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow border border-gray-200">
                <Briefcase className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Exclusive Listings</h3>
                  <p className="text-gray-600">Access premium properties not available to the general public</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow border border-gray-200">
                <Target className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Lead Generation</h3>
                  <p className="text-gray-600">Receive qualified leads through our platform's matching system</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow border border-gray-200">
                <TrendingUp className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Higher Commissions</h3>
                  <p className="text-gray-600">Competitive commission structure with bonus opportunities</p>
                </div>
              </div>
              
              <div className="flex items-start space-x-4 p-6 bg-white rounded-xl shadow border border-gray-200">
                <Award className="w-6 h-6 text-blue-600 mt=1" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Support</h3>
                  <p className="text-gray-600">Dedicated support team and marketing resources</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Application Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Agent Application</h2>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your full name"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="+1 (555) 000-0000"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience
                </label>
                <select
                  name="experience"
                  value={formData.experience}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select experience level</option>
                  <option value="0-1">0-1 years (New Agent)</option>
                  <option value="2-5">2-5 years (Experienced)</option>
                  <option value="5-10">5-10 years (Senior)</option>
                  <option value="10+">10+ years (Expert)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Real Estate License Number
                </label>
                <input
                  type="text"
                  name="license"
                  value={formData.license}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your license number"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional Bio
                </label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={handleChange}
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Tell us about your experience and specialties..."
                  required
                />
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="agree"
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  required
                />
                <label htmlFor="agree" className="text-sm text-gray-600">
                  I agree to the terms and conditions and confirm that I hold a valid real estate license
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-semibold text-lg"
              >
                Submit Application
              </button>
            </form>

            <p className="text-center text-gray-500 text-sm mt-6">
              Our team will review your application and contact you within 48 hours
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}