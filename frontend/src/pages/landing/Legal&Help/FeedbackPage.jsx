import React, { useState, useEffect } from "react";
import Header from "../Header.jsx";
import Footer from "../../../components/Footer";
import { Mail, Send, CheckCircle, AlertCircle, Star, ThumbsUp, MessageSquare, User, Type } from "lucide-react";
import api from "../../../api/axios";

const FeedbackPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    message: "",
    rating: 0,
    allowContact: false
  });
  
  const [formStatus, setFormStatus] = useState({
    submitting: false,
    submitted: false,
    error: null,
    success: false
  });

  const [contactInfo, setContactInfo] = useState({
    email: "oliviuusteam@gmail.com",
    phone: "+250 788 880 266",
    location: "Musanze, Rwanda"
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(true);

  // Fetch contact info from server
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.get('/contact/info');
        if (response.data.success) {
          setContactInfo(prev => ({
            ...prev,
            ...response.data.data
          }));
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoadingContactInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  const categories = [
    "Feature Request",
    "Bug Report",
    "Streaming Issues",
    "Content Suggestions",
    "Account Problems",
    "Payment Issues",
    "Website/App Feedback",
    "Customer Service",
    "Other"
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleRatingClick = (rating) => {
    setFormData(prev => ({
      ...prev,
      rating
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name.trim() || !formData.email.trim() || !formData.message.trim()) {
      setFormStatus({
        submitting: false,
        submitted: true,
        error: "Please fill in all required fields",
        success: false
      });
      return;
    }

    if (!formData.email.includes('@')) {
      setFormStatus({
        submitting: false,
        submitted: true,
        error: "Please enter a valid email address",
        success: false
      });
      return;
    }

    setFormStatus({
      submitting: true,
      submitted: false,
      error: null,
      success: false
    });

    try {
      // In a real app, you would send this to your backend
      // await api.post('/feedback', formData);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormStatus({
        submitting: false,
        submitted: true,
        error: null,
        success: true
      });
      
      // Reset form on success
      setFormData({
        name: "",
        email: "",
        category: "",
        message: "",
        rating: 0,
        allowContact: false
      });

      // Auto-clear success message after 5 seconds
      setTimeout(() => {
        setFormStatus(prev => ({ ...prev, submitted: false }));
      }, 5000);

    } catch (error) {
      setFormStatus({
        submitting: false,
        submitted: true,
        error: "Failed to submit feedback. Please try again.",
        success: false
      });
    }
  };

  const getRatingText = (rating) => {
    switch(rating) {
      case 1: return "Very Poor";
      case 2: return "Poor";
      case 3: return "Average";
      case 4: return "Good";
      case 5: return "Excellent";
      default: return "Not rated";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      <Header />
      
      {/* Main Content */}
      <main className="pt-28 pb-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-2xl mb-6">
              <MessageSquare className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-[#BC8BBC] to-purple-600 bg-clip-text text-transparent">
              Share Your Feedback
            </h1>
            <p className="text-lg text-gray-300 max-w-2xl mx-auto">
              Your insights help us improve Oliviuus and create a better streaming experience for everyone
            </p>
            <div className="w-32 h-1 bg-gradient-to-r from-[#BC8BBC] to-purple-600 mx-auto mt-8 rounded-full"></div>
          </div>

          {/* Success Message */}
          {formStatus.submitted && formStatus.success && (
            <div className="mb-10 bg-gradient-to-r from-green-900/30 to-emerald-900/30 border border-green-700/50 rounded-2xl p-8">
              <div className="flex items-start">
                <CheckCircle className="w-12 h-12 text-green-400 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-green-300 mb-2">Thank You for Your Feedback!</h3>
                  <p className="text-green-200">
                    Your feedback has been submitted successfully. Our team will review it carefully.
                    {formData.allowContact && " We may contact you at " + formData.email + " if we need more information."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {formStatus.submitted && formStatus.error && (
            <div className="mb-10 bg-gradient-to-r from-red-900/30 to-rose-900/30 border border-red-700/50 rounded-2xl p-8">
              <div className="flex items-start">
                <AlertCircle className="w-12 h-12 text-red-400 mr-4 flex-shrink-0" />
                <div>
                  <h3 className="text-2xl font-bold text-red-300 mb-2">Submission Failed</h3>
                  <p className="text-red-200">{formStatus.error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Intro Section */}
          <div className="mb-16">
            <div className="bg-gray-900/40 rounded-2xl p-8 border border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-center">We Value Your Opinion</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ThumbsUp className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Help Us Improve</h3>
                  <p className="text-gray-400 text-sm">
                    Your feedback directly influences our product development and feature updates
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Share Your Experience</h3>
                  <p className="text-gray-400 text-sm">
                    Tell us what you love, what you don't, and what you'd like to see in the future
                  </p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Quick Response</h3>
                  <p className="text-gray-400 text-sm">
                    Our team reviews every submission and uses your insights to enhance Oliviuus
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Feedback Form */}
          <div className="bg-gray-900/40 rounded-2xl p-8 border border-gray-800 mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Submit Your Feedback</h2>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 mb-3 font-medium">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Your Name *
                    </div>
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Enter your full name"
                    className="w-full px-5 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-gray-300 mb-3 font-medium">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email Address *
                    </div>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="your.email@example.com"
                    className="w-full px-5 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300"
                    required
                  />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-300 mb-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Category *
                  </div>
                </label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  className="w-full px-5 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300"
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((cat, index) => (
                    <option key={index} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Rating */}
              <div>
                <label className="block text-gray-300 mb-3 font-medium">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4" />
                    Overall Rating
                  </div>
                </label>
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => handleRatingClick(star)}
                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 transform hover:scale-110 ${
                          formData.rating >= star
                            ? 'bg-gradient-to-r from-[#BC8BBC] to-purple-600 text-white'
                            : 'bg-gray-800/60 border border-gray-700 text-gray-400 hover:border-[#BC8BBC]'
                        }`}
                      >
                        <span className="text-xl">{star}</span>
                        <Star className={`w-4 h-4 ml-1 ${formData.rating >= star ? 'fill-current' : ''}`} />
                      </button>
                    ))}
                  </div>
                  <div className="text-gray-300 font-medium">
                    {formData.rating > 0 ? (
                      <span className="text-[#BC8BBC]">{getRatingText(formData.rating)}</span>
                    ) : (
                      <span className="text-gray-500">Click to rate</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Message */}
              <div>
                <label className="block text-gray-300 mb-3 font-medium">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Your Feedback *
                  </div>
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="6"
                  placeholder="Please provide detailed feedback about your experience, suggestions for improvement, or any issues you've encountered..."
                  className="w-full px-5 py-3 bg-gray-800/60 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-[#BC8BBC] focus:ring-2 focus:ring-[#BC8BBC]/30 transition-all duration-300 resize-none"
                  required
                />
                <p className="text-gray-500 text-sm mt-2">
                  Please be specific and include details that will help us understand and address your feedback
                </p>
              </div>

              {/* Allow Contact */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="allowContact"
                  id="allowContact"
                  checked={formData.allowContact}
                  onChange={handleInputChange}
                  className="w-5 h-5 bg-gray-800/60 border border-gray-700 rounded focus:ring-2 focus:ring-[#BC8BBC] text-[#BC8BBC]"
                />
                <label htmlFor="allowContact" className="ml-3 text-gray-300 text-sm">
                  Allow Oliviuus team to contact you for follow-up questions about your feedback
                </label>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={formStatus.submitting}
                  className="w-full bg-gradient-to-r from-[#BC8BBC] to-purple-600 hover:from-purple-600 hover:to-[#BC8BBC] text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-3"
                >
                  {formStatus.submitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Submit Feedback
                    </>
                  )}
                </button>
                <p className="text-gray-500 text-sm text-center mt-4">
                  * Required fields
                </p>
              </div>
            </form>
          </div>

          {/* Alternative Contact Methods */}
          <div className="bg-gray-900/40 rounded-2xl p-8 border border-gray-800">
            <h2 className="text-2xl font-bold mb-8 text-center">Other Ways to Reach Us</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Email */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Mail className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-lg font-semibold mb-3">Email Feedback</h3>
                {loadingContactInfo ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <a 
                      href={`mailto:${contactInfo.email}?subject=Oliviuus Feedback`} 
                      className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                    >
                      {contactInfo.email}
                    </a>
                    <p className="text-gray-400 text-sm">
                      Send us an email with your feedback
                    </p>
                    <a 
                      href={`mailto:${contactInfo.email}?subject=Oliviuus Feedback`}
                      className="inline-block mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      Open Email
                    </a>
                  </>
                )}
              </div>

              {/* Phone */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Phone Support</h3>
                {loadingContactInfo ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <a 
                      href={`tel:${contactInfo.phone}`} 
                      className="text-[#BC8BBC] hover:text-purple-400 transition-colors font-medium block mb-2"
                    >
                      {contactInfo.phone}
                    </a>
                    <p className="text-gray-400 text-sm">
                      Call us to share feedback directly
                    </p>
                    <a 
                      href={`tel:${contactInfo.phone}`}
                      className="inline-block mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors"
                    >
                      Call Now
                    </a>
                  </>
                )}
              </div>

              {/* Location */}
              <div className="text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-[#BC8BBC] to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold mb-3">Our Location</h3>
                {loadingContactInfo ? (
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-700 rounded w-40 mx-auto mb-2"></div>
                    <div className="h-3 bg-gray-700 rounded w-32 mx-auto"></div>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-300 font-medium mb-2">
                      {contactInfo.location}
                    </p>
                    <p className="text-gray-400 text-sm">
                      Based in Rwanda, serving audiences worldwide
                    </p>
                    <button className="inline-block mt-4 px-6 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-300 hover:text-white transition-colors">
                      View on Map
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* What Happens Next */}
          <div className="mt-16 text-center">
            <h3 className="text-2xl font-bold mb-6">What Happens After You Submit?</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="text-3xl font-bold text-[#BC8BBC] mb-2">1</div>
                <h4 className="font-semibold mb-2">Review</h4>
                <p className="text-gray-400 text-sm">Our team reviews every submission</p>
              </div>
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="text-3xl font-bold text-[#BC8BBC] mb-2">2</div>
                <h4 className="font-semibold mb-2">Categorize</h4>
                <p className="text-gray-400 text-sm">Feedback is categorized and prioritized</p>
              </div>
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="text-3xl font-bold text-[#BC8BBC] mb-2">3</div>
                <h4 className="font-semibold mb-2">Plan</h4>
                <p className="text-gray-400 text-sm">We incorporate insights into our roadmap</p>
              </div>
              <div className="bg-gray-900/30 p-6 rounded-xl border border-gray-800">
                <div className="text-3xl font-bold text-[#BC8BBC] mb-2">4</div>
                <h4 className="font-semibold mb-2">Implement</h4>
                <p className="text-gray-400 text-sm">Features and fixes are developed based on feedback</p>
              </div>
            </div>
            <p className="text-gray-400 mt-8 max-w-2xl mx-auto">
              We appreciate every piece of feedback we receive. While we can't respond to every submission individually, 
              we read them all and use them to guide our development priorities.
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default FeedbackPage;