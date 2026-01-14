import React, { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const FAQAccordion = () => {
  const [openIndex, setOpenIndex] = useState(null);
  const { t } = useTranslation();

  const faqs = [
    {
      question: t('faq.canChangePlan', "Can I change my plan later?"),
      answer: t('faq.changePlanAnswer', "Yes, you can upgrade or downgrade your plan at any time. Changes take effect at the start of your next billing cycle. Upgrades are prorated, while downgrades take effect after your current billing period ends.")
    },
    {
      question: t('faq.commitmentPeriod', "Is there a commitment period?"),
      answer: t('faq.commitmentAnswer', "No, all plans are month-to-month with no long-term commitment. Cancel anytime without fees. Your subscription will remain active until the end of your current billing period.")
    },
    {
      question: t('faq.devicesSimultaneously', "How many devices can I use simultaneously?"),
      answer: t('faq.devicesAnswer', "The number of simultaneous streams varies by plan. Please check the specific device limits for each plan in our comparison table to find the one that best suits your household's needs.")
    },
    {
      question: t('faq.discountsAvailable', "Do you offer student, military, or loyalty discounts?"),
      answer: t('faq.discountsAnswer', "While we currently don't support loyalty or special discounts, we're actively working on implementing a comprehensive loyalty program. Stay tuned for future updates as we continue to enhance our subscription offerings.")
    },
    {
      question: t('faq.paymentMethods', "What payment methods do you accept?"),
      answer: t('faq.paymentAnswer', "We accept mobile money (MTN, Airtel), credit/debit cards (Visa, MasterCard), and bank transfers. All payments are secure and encrypted for your protection.")
    },
    {
      question: t('faq.offlineViewing', "Can I download content for offline viewing?"),
      answer: t('faq.offlineAnswer', "Offline download availability depends on your selected plan. Please review the feature comparison between plans to see which ones include download capabilities and their respective limits.")
    },
    {
      question: t('faq.regionalAvailability', "Is content available in all regions?"),
      answer: t('faq.regionalAnswer', "Due to licensing agreements, some content may not be available in all regions. Our catalog is optimized for East African audiences with a rich mix of local and international content.")
    },
    {
      question: t('faq.cancelSubscription', "How do I cancel my subscription?"),
      answer: t('faq.cancelAnswer', "You can cancel anytime from your account settings. Navigate to 'Subscription' → 'Manage Plan' → 'Cancel Subscription'. Your access will continue until the end of your current billing period.")
    },
    {
      question: t('faq.videoQuality', "What video quality can I expect?"),
      answer: t('faq.qualityAnswer', "Video quality varies by subscription plan, ranging from standard definition to 4K Ultra HD. Please refer to the plan comparison for specific quality offerings that match each tier.")
    },
    {
      question: t('faq.billingCycle', "When does my billing cycle start?"),
      answer: t('faq.billingAnswer', "Your billing cycle starts immediately upon subscription and renews automatically every 30 days. You'll receive a notification before each renewal, and you can cancel at any time without penalty.")
    }
  ];

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="mt-16 w-full max-w-4xl">
      <div className="text-center mb-10">
        <h2 className="text-3xl font-bold text-white mb-4">
          {t('faq.title', "Frequently Asked Questions")}
        </h2>
        <p className="text-gray-300 text-lg">
          {t('faq.subtitle', "Get answers to common questions about our subscription plans")}
        </p>
      </div>

      <div className="space-y-4">
        {faqs.map((faq, index) => (
          <div 
            key={index} 
            className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden transition-all duration-300 hover:border-gray-600"
          >
            <button
              onClick={() => toggleFAQ(index)}
              className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-750 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-opacity-50 rounded-xl"
            >
              <h3 className="text-white font-semibold text-lg pr-4">{faq.question}</h3>
              <div className="flex-shrink-0">
                {openIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-[#BC8BBC]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[#BC8BBC]" />
                )}
              </div>
            </button>
            
            {openIndex === index && (
              <div className="px-6 pb-4">
                <div className="border-t border-gray-700 pt-4">
                  <p className="text-gray-300 leading-relaxed">{faq.answer}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Additional Support Section */}
      <div className="mt-12 text-center p-6 bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl border border-gray-700">
        <h3 className="text-white font-semibold text-xl mb-2">
          {t('faq.needMoreHelp', "Need more help?")}
        </h3>
        <p className="text-gray-300 mb-4">
          {t('faq.contactSupport', "Our support team is here to assist you with any additional questions")}
        </p>
        <button className="bg-[#BC8BBC] hover:bg-[#9b69b2] text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200">
          {t('faq.contactUs', "Contact Support")}
        </button>
      </div>
    </div>
  );
};

export default FAQAccordion;