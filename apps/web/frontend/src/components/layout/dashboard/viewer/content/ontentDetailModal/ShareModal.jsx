// src/pages/Dashboards/viewer/content/components/ShareModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Facebook, Twitter, Instagram, MessageCircle, Link2, Mail, Share2, QrCode, Download } from 'lucide-react';
import api from '../../../../../../api/axios';

const ShareModal = ({ content, onClose }) => {
  const { t } = useTranslation();
  const [showCopiedMessage, setShowCopiedMessage] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState(null);
  const [isGeneratingQr, setIsGeneratingQr] = useState(false);
  const qrCanvasRef = useRef(null);
  const logoImageRef = useRef(null);

  const shareUrl = `${window.location.origin}/title/${content.id}`;
  const shareText = t('contentdetail.share.shareText', 'Check out "{{title}}"', { title: content.title });

  // Animation on mount
  useEffect(() => {
    setIsVisible(true);
    loadLogoAndGenerateQR();
  }, []);

  // Load logo image first, then generate QR
  const loadLogoAndGenerateQR = async () => {
    setIsGeneratingQr(true);
    
    try {
      // Load the logo image
      const logoImage = new Image();
      logoImage.crossOrigin = 'anonymous';
      
      // IMPORTANT: Update this path to your actual logo PNG file
      // If your logo is in public folder, use: '/logo.png'
      // If it's in src/assets, you might need to import it differently
      logoImage.src = '/logo.png'; // Or your actual logo path
      
      // Wait for logo to load
      await new Promise((resolve, reject) => {
        logoImage.onload = resolve;
        logoImage.onerror = reject;
        setTimeout(() => reject(new Error('Logo loading timeout')), 5000);
      });
      
      logoImageRef.current = logoImage;
      
      // Generate QR code with the loaded logo
      await generateQRCodeWithLogo(logoImage);
      
    } catch (error) {
      console.error('Logo loading error:', error);
      // Fallback: Generate QR without logo
      await generateQRCodeWithoutLogo();
    } finally {
      setIsGeneratingQr(false);
    }
  };

  const generateQRCodeWithLogo = async (logoImage) => {
    try {
      const QRCode = await import('qrcode');
      
      // Create canvas for QR code
      const canvas = document.createElement('canvas');
      const qrSize = 400;
      canvas.width = qrSize;
      canvas.height = qrSize;
      
      // Generate QR code
      await QRCode.toCanvas(canvas, shareUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000', // Black QR code
          light: '#FFFFFF' // White background
        },
        errorCorrectionLevel: 'H'
      });

      const ctx = canvas.getContext('2d');
      
      // Logo size - adjust as needed
      const logoSize = 80;
      const logoBackgroundSize = logoSize + 8; // Add padding
      
      // Create logo container with circular background
      const logoContainer = document.createElement('canvas');
      logoContainer.width = logoBackgroundSize;
      logoContainer.height = logoBackgroundSize;
      const containerCtx = logoContainer.getContext('2d');
      
      // Draw circular background
      containerCtx.fillStyle = '#BC8BBC';
      containerCtx.beginPath();
      containerCtx.arc(
        logoBackgroundSize / 2, 
        logoBackgroundSize / 2, 
        logoBackgroundSize / 2, 
        0, 
        Math.PI * 2
      );
      containerCtx.fill();
      
      // Calculate logo position inside the circle
      const logoImgSize = logoSize * 0.7; // Logo takes 70% of the circle
      const logoImgX = (logoBackgroundSize - logoImgSize) / 2;
      const logoImgY = (logoBackgroundSize - logoImgSize) / 2;
      
      // Draw the logo image with white background
      containerCtx.save();
      containerCtx.beginPath();
      containerCtx.arc(
        logoBackgroundSize / 2,
        logoBackgroundSize / 2,
        logoImgSize / 2,
        0,
        Math.PI * 2
      );
      containerCtx.clip();
      containerCtx.fillStyle = '#FFFFFF';
      containerCtx.fillRect(logoImgX, logoImgY, logoImgSize, logoImgSize);
      containerCtx.drawImage(logoImage, logoImgX, logoImgY, logoImgSize, logoImgSize);
      containerCtx.restore();
      
      // Draw logo container onto QR code
      const centerX = qrSize / 2 - logoBackgroundSize / 2;
      const centerY = qrSize / 2 - logoBackgroundSize / 2;
      ctx.drawImage(logoContainer, centerX, centerY, logoBackgroundSize, logoBackgroundSize);
      
      // Convert to data URL for download
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setQrCodeDataUrl(dataUrl);
      qrCanvasRef.current = canvas;
      
    } catch (error) {
      console.error('QR Code generation error:', error);
      throw error;
    }
  };

  const generateQRCodeWithoutLogo = async () => {
    try {
      const QRCode = await import('qrcode');
      
      const canvas = document.createElement('canvas');
      const qrSize = 400;
      canvas.width = qrSize;
      canvas.height = qrSize;
      
      await QRCode.toCanvas(canvas, shareUrl, {
        width: qrSize,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      });
      
      const dataUrl = canvas.toDataURL('image/png', 1.0);
      setQrCodeDataUrl(dataUrl);
      qrCanvasRef.current = canvas;
      
    } catch (error) {
      console.error('QR Code generation error:', error);
    }
  };

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
    }
  };

  const downloadQRCode = () => {
    if (!qrCodeDataUrl) return;
    
    const link = document.createElement('a');
    link.download = `oliviuus-${content.title.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-qrcode.png`;
    link.href = qrCodeDataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Track QR code download
    trackShare('qr_code', 'download');
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
          className={`bg-gray-800 rounded-2xl w-full max-w-lg mx-auto border border-gray-700 shadow-2xl transform transition-all duration-300 overflow-hidden ${
            isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-95 opacity-0 translate-y-4'
          }`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-700">
            <h3 className="text-lg sm:text-xl font-bold text-white">{t('contentdetail.share.title', 'Share this content')}</h3>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-white transition-colors p-1 sm:p-2 rounded-lg hover:bg-gray-700 transform hover:scale-110 duration-200"
              title={t('contentdetail.actions.close', 'Close')}
            >
              <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </div>

          {/* Scrollable content */}
          <div className="max-h-[80vh] overflow-y-auto">
            {/* Content Preview */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={content.primary_image_url}
                  alt={content.title}
                  className="w-12 h-16 sm:w-16 sm:h-20 object-cover rounded-lg shadow-lg flex-shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-white font-semibold text-base sm:text-lg truncate">{content.title}</h4>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1 line-clamp-2">
                    {content.short_description}
                  </p>
                </div>
              </div>
            </div>

            {/* QR Code Section */}
            <div className="p-4 sm:p-6 border-b border-gray-700">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-white font-semibold flex items-center gap-2 text-base sm:text-lg">
                  <QrCode className="w-4 h-4 sm:w-5 sm:h-5" />
                  {t('contentdetail.share.qrCode.title', 'QR Code')}
                </h4>
              </div>
              
              <div className="flex flex-col items-center gap-4">
                <div className="relative bg-white p-3 sm:p-4 rounded-xl w-full max-w-xs mx-auto">
                  {isGeneratingQr ? (
                    <div className="w-full aspect-square flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#BC8BBC]"></div>
                    </div>
                  ) : qrCodeDataUrl ? (
                    <div className="relative w-full aspect-square">
                      {/* This image will show the QR code WITH logo embedded */}
                      <img 
                        src={qrCodeDataUrl} 
                        alt="QR Code"
                        className="w-full h-full object-contain"
                      />
                    </div>
                  ) : null}
                </div>
                
                <div className="text-center w-full max-w-xs mx-auto">
                  <p className="text-gray-400 text-xs sm:text-sm mb-3 px-2">
                    {t('contentdetail.share.qrCode.description', 'Scan this QR code to instantly access this content')}
                  </p>
                  <button
                    onClick={downloadQRCode}
                    disabled={isGeneratingQr || !qrCodeDataUrl}
                    className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 sm:px-6 sm:py-3 rounded-lg font-semibold transition-all duration-200 active:scale-95 ${
                      isGeneratingQr || !qrCodeDataUrl
                        ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                        : 'bg-[#BC8BBC] hover:bg-[#a56ba5] text-white'
                    }`}
                  >
                    <Download className="w-4 h-4 sm:w-5 sm:h-5" />
                    {t('contentdetail.share.qrCode.download', 'Download QR Code')}
                  </button>
                </div>
              </div>
            </div>

            {/* Share Options */}
            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-4 sm:grid-cols-4 gap-2 sm:gap-3 mb-4 sm:mb-6">
                {shareOptions.map((option, index) => (
                  <button
                    key={option.name}
                    onClick={option.share}
                    className={`flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl text-white transition-all duration-200 active:scale-95 ${option.color} animate-rise`}
                    style={{ animationDelay: `${index * 100}ms` }}
                    title={option.name}
                  >
                    <option.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                    <span className="text-[10px] xs:text-xs font-medium truncate w-full text-center">
                      {option.name}
                    </span>
                  </button>
                ))}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col xs:flex-row gap-2 sm:gap-3">
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-700 hover:bg-gray-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-all duration-200 active:scale-95"
                >
                  <Link2 className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="text-sm sm:text-base">{t('contentdetail.share.copyLink', 'Copy Link')}</span>
                </button>
                
                {navigator.share && (
                  <button
                    onClick={handleNativeShare}
                    className="flex-1 bg-[#BC8BBC] hover:bg-[#a56ba5] text-white py-2.5 sm:py-3 px-4 rounded-lg font-semibold transition-all duration-200 active:scale-95"
                  >
                    <span className="text-sm sm:text-base">{t('contentdetail.share.moreOptions', 'More Options')}</span>
                  </button>
                )}
              </div>
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
        
        .overflow-y-auto::-webkit-scrollbar {
          width: 6px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-track {
          background: #374151;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb {
          background: #6B7280;
          border-radius: 3px;
        }
        
        .overflow-y-auto::-webkit-scrollbar-thumb:hover {
          background: #9CA3AF;
        }
      `}</style>
    </>
  );
};

export default ShareModal;