// src/pages/Dashboards/viewer/content/components/ShareModal.jsx
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Facebook, Twitter, Instagram, MessageCircle, Link2, Mail, Share2 } from 'lucide-react';
import api from '../../../../../../api/axios';

const ShareModal = ({ content, onClose }) => {
  const { t } = useTranslation();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  const shareUrl = `${window.location.origin}/title/${content.id}`;
  const shareText = t('contentdetail.share.shareText', 'Check out "{{title}}"', { title: content.title });

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  // Track share function
  const trackShare = async (platform, method = 'share_modal') => {
    try {
      await api.post(`/viewer/content/${content.id}/share`, {
        platform: platform,
        method: method,
        share_url: shareUrl
      });
    } catch (error) {
      console.error('Error tracking share:', error);
      // Don't show error to user for analytics
    }
  };

  const shareOptions = [
    {
      name: t('contentdetail.share.platforms.facebook', 'Facebook'),
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      share: () => {
        trackShare('facebook');
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      name: t('contentdetail.share.platforms.twitter', 'Twitter'),
      icon: Twitter,
      color: 'bg-blue-400 hover:bg-blue-500',
      share: () => {
        trackShare('twitter');
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      name: t('contentdetail.share.platforms.instagram', 'Instagram'),
      icon: Instagram,
      color: 'bg-pink-600 hover:bg-pink-700',
      share: () => {
        trackShare('instagram');
        copyToClipboard();
      }
    },
    {
      name: t('contentdetail.share.platforms.whatsapp', 'WhatsApp'),
      icon: MessageCircle,
      color: 'bg-green-500 hover:bg-green-600',
      share: () => {
        trackShare('whatsapp');
        window.open(`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      }
    },
    {
      name: t('contentdetail.share.platforms.tiktok', 'TikTok'),
      icon: Share2,
      color: 'bg-black hover:bg-gray-900',
      share: () => {
        trackShare('tiktok');
        copyToClipboard();
      }
    },
    {
      name: t('contentdetail.share.platforms.telegram', 'Telegram'),
      icon: MessageCircle,
      color: 'bg-blue-500 hover:bg-blue-600',
      share: () => {
        trackShare('telegram');
        window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`, '_blank');
      }
    },
    {
      name: t('contentdetail.share.platforms.email', 'Email'),
      icon: Mail,
      color: 'bg-gray-600 hover:bg-gray-700',
      share: () => {
        trackShare('email');
        window.open(`mailto:?subject=${encodeURIComponent(shareText)}&body=${encodeURIComponent(shareUrl)}`, '_blank');
      }
    },
    {
      name: t('contentdetail.share.platforms.sms', 'SMS'),
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      share: () => {
        trackShare('sms');
        window.open(`sms:?body=${encodeURIComponent(shareText + ' ' + shareUrl)}`, '_blank');
      }
    }
  ];

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      trackShare('copy_link');
      showCustomMessage();
    } catch (err) {
      console.error('Failed to copy: ', err);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = shareUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      trackShare('copy_link');
      showCustomMessage();
    }
  };

  const showCustomMessage = () => {
    setShowCopiedMessage(true);
    setTimeout(() => {
      setShowCopiedMessage(false);
    }, 3000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: content.title,
          text: content.short_description,
          url: shareUrl,
        });
        trackShare('native_share');
      } catch (err) {
        console.log('Error sharing:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300);
  };

  return (
    <>
      {/* Custom Copy Success Message */}
      {showCopiedMessage && (
        <div className="fixed top-6 left-1/2 transform -translate-x-1/2 z-60 animate-fade-in">
          <div className="bg-[#BC8BBC] text-white px-6 py-3 rounded-lg shadow-lg border border-[#a56ba5]">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
              <span className="font-semibold">{t('contentdetail.messages.linkCopied', 'Link copied successfully!')}</span>
            </div>
          </div>
        </div>
      )}

      {/* Modal Overlay */}
      <div 
        className={`fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleClose}
      >
        {/* Modal Content */}
        <div 
          className={`bg-gray-800 rounded-2xl max-w-md w-full border border-gray-700 shadow-2xl transform transition-all duration-300 ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <h3 className="text-xl font-bold text-white">{t('contentdetail.share.title', 'Share this content')}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg hover:bg-gray-700 transform hover:scale-110 duration-200"
              title={t('contentdetail.actions.close', 'Close')}
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Content Preview */}
          <div className="p-6 border-b border-gray-700">
            <div className="flex items-center gap-4">
              <img
                src={content.primary_image_url}
                alt={content.title}
                className="w-16 h-20 object-cover rounded-lg shadow-lg transform hover:scale-105 transition-transform duration-200"
              />
              <div>
                <h4 className="text-white font-semibold text-lg">{content.title}</h4>
                <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                  {content.short_description}
                </p>
              </div>
            </div>
          </div>

          {/* Share Options */}
          <div className="p-6">
            <div className="grid grid-cols-4 gap-3 mb-6">
              {shareOptions.map((option, index) => (
                <button
                  key={option.name}
                  onClick={option.share}
                  className={`flex flex-col items-center gap-2 p-3 rounded-xl text-white transition-all duration-300 transform hover:scale-110 active:scale-95 ${option.color} animate-rise`}
                  style={{ animationDelay: `${index * 100}ms` }}
                  title={t('contentdetail.share.shareOn', 'Share on {{platform}}', { platform: option.name })}
                >
                  <option.icon className="w-5 h-5" />
                  <span className="text-xs font-medium">{option.name}</span>
                </button>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={copyToClipboard}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
              >
                <Link2 className="w-5 h-5" />
                {t('contentdetail.share.copyLink', 'Copy Link')}
              </button>
              
              {navigator.share && (
                <button
                  onClick={handleNativeShare}
                  className="flex-1 bg-[#BC8BBC] hover:bg-[#a56ba5] text-white py-3 px-4 rounded-lg font-semibold transition-all duration-200 transform hover:scale-105 active:scale-95"
                >
                  {t('contentdetail.share.moreOptions', 'More Options')}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes rise {
          from { 
            opacity: 0;
            transform: translateY(20px) scale(0.8);
          }
          to { 
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.3s ease-out;
        }
        
        .animate-rise {
          animation: rise 0.5s ease-out forwards;
          opacity: 0;
        }
      `}</style>
    </>
  );
};

export default ShareModal;