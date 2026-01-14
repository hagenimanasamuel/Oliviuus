import React, { useState, useCallback } from 'react';
import { ArrowRight, ArrowLeft } from 'lucide-react';
import clsx from 'clsx';

// Import wizard steps
import ContentTypeStep from '../../../../components/layout/dashboard/admin/library/Steps/ContentTypeStep';
import BasicInfoStep from '../../../../components/layout/dashboard/admin/library/Steps/BasicInfoStep';
import MediaAssetsStep from '../../../../components/layout/dashboard/admin/library/Steps/MediaAssetsStep';
import ClassificationStep from '../../../../components/layout/dashboard/admin/library/Steps/ClassificationStep';
import ReviewPublishStep from '../../../../components/layout/dashboard/admin/library/Steps/ReviewPublishStep';

const STEPS = [
  { id: 'type', title: 'Type', component: ContentTypeStep },
  { id: 'basic', title: 'Basic Info', component: BasicInfoStep },
  { id: 'media', title: 'Media', component: MediaAssetsStep },
  { id: 'classification', title: 'Rating', component: ClassificationStep },
  { id: 'review', title: 'Review', component: ReviewPublishStep },
];

export default function AddNew() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    contentType: '',
    basicInfo: {},
    mediaAssets: {},
    classification: {},
    publishing: {},
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const CurrentStepComponent = STEPS[currentStep].component;

  const updateFormData = useCallback((section, data) => {
    setFormData(prev => ({
      ...prev,
      [section]: { ...prev[section], ...data }
    }));
    if (errors[section]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[section];
        return newErrors;
      });
    }
  }, [errors]);

  const validateCurrentStep = useCallback(() => {
    const stepId = STEPS[currentStep].id;
    const newErrors = {};

    switch (stepId) {
      case 'type':
        if (!formData.contentType) {
          newErrors.contentType = 'Please select a content type';
        }
        break;
      case 'basic':
        if (!formData.basicInfo?.title?.trim()) {
          newErrors.title = 'Title is required';
        }
        if (!formData.basicInfo?.description?.trim()) {
          newErrors.description = 'Description is required';
        }
        break;
      case 'media':
        if (!formData.mediaAssets?.poster) {
          newErrors.poster = 'Poster image is required';
        }
        if (!formData.mediaAssets?.mainVideo) {
          newErrors.mainVideo = 'Main video is required';
        }
        break;
      case 'classification':
        if (!formData.classification?.ageRating) {
          newErrors.ageRating = 'Age rating is required';
        }
        break;
      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, formData]);

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleBack = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));
      alert('Content published successfully!');
      setFormData({ contentType: '', basicInfo: {}, mediaAssets: {}, classification: {}, publishing: {} });
      setCurrentStep(0);
    } catch (error) {
      alert('Failed to publish content. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStepStatus = (stepIndex) => {
    if (stepIndex < currentStep) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'upcoming';
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-6">
      <div className="max-w-4xl mx-auto px-4 sm:px-6">
        {/* Compact Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Add New Content
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Step-by-step content creation
          </p>
        </div>

        {/* Compact Progress Steps */}
        <div className="mb-8">
          <nav aria-label="Progress">
            <ol className="flex items-center justify-between">
              {STEPS.map((step, index) => (
                <li key={step.id} className="flex items-center flex-1">
                  <div className="flex flex-col items-center flex-1">
                    <div
                      className={clsx(
                        'flex items-center justify-center w-8 h-8 rounded-full border-2 text-xs font-bold transition-all',
                        getStepStatus(index) === 'completed' && [
                          'bg-primary-600 border-primary-600 text-white'
                        ],
                        getStepStatus(index) === 'current' && [
                          'border-primary-600 bg-white dark:bg-gray-800 text-primary-600',
                          'ring-2 ring-primary-500/20'
                        ],
                        getStepStatus(index) === 'upcoming' && [
                          'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800',
                          'text-gray-500 dark:text-gray-400'
                        ]
                      )}
                    >
                      {getStepStatus(index) === 'completed' ? (
                        <Check className="w-3 h-3" />
                      ) : (
                        index + 1
                      )}
                    </div>
                    <span
                      className={clsx(
                        'mt-2 text-xs font-medium transition-all',
                        getStepStatus(index) === 'completed' && 'text-primary-600',
                        getStepStatus(index) === 'current' && [
                          'text-primary-600 font-semibold'
                        ],
                        getStepStatus(index) === 'upcoming' && 'text-gray-500 dark:text-gray-400'
                      )}
                    >
                      {step.title}
                    </span>
                  </div>
                  {index < STEPS.length - 1 && (
                    <div
                      className={clsx(
                        'flex-1 h-1 mx-2 transition-all',
                        index < currentStep 
                          ? 'bg-primary-600' 
                          : 'bg-gray-200 dark:bg-gray-700'
                      )}
                    />
                  )}
                </li>
              ))}
            </ol>
          </nav>
        </div>

        {/* Step Content */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 sm:p-6">
          <CurrentStepComponent
            formData={formData}
            updateFormData={updateFormData}
            errors={errors}
          />

          {/* Compact Navigation Buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 0}
              className={clsx(
                'flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-all',
                currentStep === 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : [
                      'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white',
                      'hover:bg-gray-100 dark:hover:bg-gray-700'
                    ]
              )}
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex items-center gap-3">
              {currentStep < STEPS.length - 1 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="flex items-center gap-2 px-6 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg transition-all hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/30"
                >
                  Continue
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className={clsx(
                    'px-6 py-2 text-sm font-medium rounded-lg transition-all focus:outline-none focus:ring-2',
                    isSubmitting
                      ? 'bg-green-500 cursor-not-allowed'
                      : [
                          'bg-green-600 hover:bg-green-700',
                          'focus:ring-green-500/30'
                        ]
                  )}
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Publishing...
                    </div>
                  ) : (
                    'Publish Content'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Compact Progress Indicator */}
          <div className="mt-4 text-center">
            <span className="text-xs text-gray-500 dark:text-gray-400">
              Step {currentStep + 1} of {STEPS.length}
            </span>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 mt-1">
              <div
                className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Check icon component
const Check = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
  </svg>
);