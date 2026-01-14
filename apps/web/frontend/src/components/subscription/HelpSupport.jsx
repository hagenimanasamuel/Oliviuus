import React, { useState, useEffect } from "react";
import { HelpCircle, MessageCircle, Mail, Phone, ArrowDown, Send } from "lucide-react";
import { useTranslation } from "react-i18next";
import api from "../../api/axios";

const ContactSupport = ({ 
  title, 
  subtitle,
  showSupportMethods = true,
  compact = false 
}) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    category: "",
    subject: "",
    message: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [contactInfo, setContactInfo] = useState({
    email: "support@oliviuus.com",
    phone: "+250 788 880 266"
  });
  const [loadingContactInfo, setLoadingContactInfo] = useState(true);

  // Fetch contact info from server
  useEffect(() => {
    const fetchContactInfo = async () => {
      try {
        const response = await api.get('/contact/info');
        if (response.data.success) {
          setContactInfo(response.data.data);
        }
      } catch (error) {
        console.error('Failed to fetch contact info:', error);
      } finally {
        setLoadingContactInfo(false);
      }
    };

    fetchContactInfo();
  }, []);

  // Set default values using translations
  const displayTitle = title || t('contact.contactUs', "Contact Us");
  const displaySubtitle = subtitle || t('contact.helpSubtitle', "We're here to help with any questions or concerns");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear error when user starts typing
    if (submitError) setSubmitError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError("");

    try {
      const response = await api.post('/contact/submit', formData);
      
      if (response.data.success) {
        setSubmitted(true);
        setFormData({ name: "", email: "", category: "", subject: "", message: "" });
      } else {
        setSubmitError(response.data.message || 'Failed to send message');
      }
    } catch (error) {
      console.error('Contact form submission error:', error);
      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          t('contact.submissionError', 'Failed to send message. Please try again.');
      setSubmitError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const scrollToForm = () => {
    document.getElementById('contact-form-section').scrollIntoView({ 
      behavior: 'smooth',
      block: 'start'
    });
  };

  const contactCategories = [
    { value: "general", label: t('contact.generalInquiry', "General Inquiry") },
    { value: "technical", label: t('contact.technicalSupport', "Technical Support") },
    { value: "billing", label: t('contact.billingQuestion', "Billing Question") },
    { value: "feature_request", label: t('contact.featureRequest', "Feature Request") },
    { value: "bug_report", label: t('contact.bugReport', "Bug Report") },
    { value: "partnership", label: t('contact.partnership', "Partnership") },
    { value: "feedback", label: t('contact.feedback', "Feedback & Suggestions") },
    { value: "other", label: t('contact.other', "Other") }
  ];

  if (compact) {
    return (
      <div id="contact-form-section" className="scroll-mt-20">
        <div className="bg-gray-800 rounded-xl border border-gray-700 p-6">
          <div className="text-center mb-6">
            <h3 className="text-xl font-bold text-white mb-2">{displayTitle}</h3>
            <p className="text-gray-300 text-sm">{displaySubtitle}</p>
          </div>

          {submitted ? (
            <div className="bg-green-900/50 border border-green-700 rounded-lg p-4 text-center">
              <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h4 className="text-white font-semibold text-sm mb-1">{t('contact.messageSent', "Message Sent Successfully!")}</h4>
              <p className="text-gray-300 text-xs">{t('contact.responseTime', "We'll get back to you soon.")}</p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-3 text-[#BC8BBC] hover:text-[#9b69b2] font-medium text-sm"
              >
                {t('contact.sendAnother', "Send another message")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors text-sm"
                    placeholder={t('contact.namePlaceholder', "Your name")}
                  />
                </div>
                <div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors text-sm"
                    placeholder={t('contact.emailPlaceholder', "Your email")}
                  />
                </div>
              </div>

              <div>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors text-sm"
                >
                  <option value="">{t('contact.selectCategory', "Select category")}</option>
                  {contactCategories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors text-sm"
                  placeholder={t('contact.subjectPlaceholder', "Subject")}
                />
              </div>

              <div>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="3"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-3 py-2 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors resize-none text-sm"
                  placeholder={t('contact.messagePlaceholder', "Your message...")}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-3 text-center">
                  <p className="text-red-300 text-sm">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed text-sm flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('contact.sending', "Sending...")}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>{t('contact.sendMessage', "Send Message")}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl">
      {/* Contact CTA */}
      <div className="text-center mb-12 bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-700">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-[#BC8BBC] rounded-full flex items-center justify-center">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-white mb-3">
          {t('contact.needHelp', "Need Help?")}
        </h2>
        <p className="text-gray-300 mb-6 max-w-2xl mx-auto">
          {t('contact.ctaDescription', "Our team is here to assist you with any questions, feedback, or concerns. We're always happy to help!")}
        </p>
        <button
          onClick={scrollToForm}
          className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 flex items-center space-x-2 mx-auto"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{t('contact.getInTouch', "Get In Touch")}</span>
          <ArrowDown className="w-4 h-4" />
        </button>
      </div>

      {/* Contact Section */}
      <div id="contact-form-section" className="scroll-mt-20">
        <div className="bg-gray-800 rounded-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-2">{displayTitle}</h3>
            <p className="text-gray-300">{displaySubtitle}</p>
          </div>

          {/* Support Methods */}
          {showSupportMethods && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <div className="bg-gray-750 rounded-xl p-6 text-center border border-gray-600">
                <Mail className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
                <h4 className="text-white font-semibold mb-2">
                  {t('contact.emailSupport', "Email Support")}
                </h4>
                <p className="text-gray-300 text-sm">
                  {loadingContactInfo ? "Loading..." : contactInfo.email}
                </p>
                <p className="text-gray-400 text-xs">
                  {t('contact.responseTime', "Response within 2 hours")}
                </p>
              </div>
              
              <div className="bg-gray-750 rounded-xl p-6 text-center border border-gray-600">
                <Phone className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
                <h4 className="text-white font-semibold mb-2">
                  {t('contact.phoneSupport', "Phone Support")}
                </h4>
                <p className="text-gray-300 text-sm">
                  {loadingContactInfo ? "Loading..." : contactInfo.phone}
                </p>
                <p className="text-gray-400 text-xs">
                  {t('contact.phoneHours', "Mon-Sun, 8AM-10PM")}
                </p>
              </div>
              
              <div className="bg-gray-750 rounded-xl p-6 text-center border border-gray-600">
                <MessageCircle className="w-8 h-8 text-[#BC8BBC] mx-auto mb-3" />
                <h4 className="text-white font-semibold mb-2">
                  {t('contact.liveChat', "Live Chat")}
                </h4>
                <p className="text-gray-300 text-sm">
                  {t('contact.available247', "Available 24/7")}
                </p>
                <p className="text-gray-400 text-xs">
                  {t('contact.instantSupport', "Instant support")}
                </p>
              </div>
            </div>
          )}

          {/* Contact Form */}
          {submitted ? (
            <div className="bg-green-900/50 border border-green-700 rounded-xl p-6 text-center">
              <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h4 className="text-white font-semibold text-lg mb-2">
                {t('contact.messageSent', "Message Sent Successfully!")}
              </h4>
              <p className="text-gray-300">
                {t('contact.thankYou', "Thank you for reaching out. We'll get back to you soon.")}
              </p>
              <button
                onClick={() => setSubmitted(false)}
                className="mt-4 text-[#BC8BBC] hover:text-[#9b69b2] font-medium"
              >
                {t('contact.sendAnother', "Send another message")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('contact.fullName', "Full Name")}
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
                    placeholder={t('contact.namePlaceholder', "Enter your full name")}
                  />
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('contact.emailAddress', "Email Address")}
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
                    placeholder={t('contact.emailPlaceholder', "Enter your email")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('contact.category', "Category")}
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
                  >
                    <option value="">{t('contact.selectCategory', "Select a category")}</option>
                    {contactCategories.map(cat => (
                      <option key={cat.value} value={cat.value}>{cat.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-300 text-sm font-medium mb-2">
                    {t('contact.subject', "Subject")}
                  </label>
                  <input
                    type="text"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors"
                    placeholder={t('contact.subjectPlaceholder', "Brief subject line")}
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 text-sm font-medium mb-2">
                  {t('contact.message', "Message")}
                </label>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  rows="6"
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-[#BC8BBC] focus:ring-1 focus:ring-[#BC8BBC] transition-colors resize-none"
                  placeholder={t('contact.messagePlaceholder', "Tell us how we can help you...")}
                />
              </div>

              {/* Error Message */}
              {submitError && (
                <div className="bg-red-900/50 border border-red-700 rounded-lg p-4 text-center">
                  <p className="text-red-300">{submitError}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#BC8BBC] hover:bg-[#9b69b2] text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed transform hover:scale-105 flex items-center justify-center space-x-2"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t('contact.sending', "Sending Message...")}</span>
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    <span>{t('contact.sendMessage', "Send Message")}</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;