// src/components/LandingPage/property/ShareModal.jsx
import React, { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { X, Copy, Check, Share2, Link as LinkIcon, Download, ChevronUp, Smartphone, Globe, Users, Smartphone as SmartphoneIcon } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, property }) {
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [sheetHeight, setSheetHeight] = useState('75%');
  const sheetRef = useRef(null);
  const dragStartY = useRef(0);
  const startHeight = useRef(0);
  
  const shareUrl = `${window.location.origin}/properties/${property?.property_uid}`;
  const shareTitle = property?.title || 'Check out this property on iSanzure';

  useEffect(() => {
    if (isOpen && property) {
      setIsGenerating(true);
      QRCode.toDataURL(shareUrl, {
        width: 140,
        margin: 1,
        color: {
          dark: '#8A5A8A',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'H'
      }).then(url => {
        setQrCodeUrl(url);
        setIsGenerating(false);
      });
    }
  }, [isOpen, property, shareUrl]);

  // Handle drag functionality for bottom sheet
  useEffect(() => {
    if (!isOpen || !sheetRef.current) return;

    const sheet = sheetRef.current;

    const handleTouchStart = (e) => {
      const touch = e.touches[0];
      setIsDragging(true);
      dragStartY.current = touch.clientY;
      startHeight.current = parseFloat(sheetHeight);
      e.preventDefault();
    };

    const handleMouseStart = (e) => {
      setIsDragging(true);
      dragStartY.current = e.clientY;
      startHeight.current = parseFloat(sheetHeight);
    };

    const handleMove = (clientY) => {
      if (!isDragging) return;

      const deltaY = dragStartY.current - clientY;
      const newHeight = Math.min(Math.max(50, startHeight.current + (deltaY / window.innerHeight) * 100), 90);
      setSheetHeight(`${newHeight}%`);
    };

    const handleTouchMove = (e) => {
      handleMove(e.touches[0].clientY);
    };

    const handleMouseMove = (e) => {
      handleMove(e.clientY);
    };

    const handleEnd = () => {
      if (!isDragging) return;
      setIsDragging(false);

      const heightValue = parseFloat(sheetHeight);
      if (heightValue < 60) {
        onClose();
        setSheetHeight('75%');
      } else if (heightValue > 80) {
        setSheetHeight('90%');
      } else if (heightValue < 70) {
        setSheetHeight('60%');
      } else {
        setSheetHeight('75%');
      }
    };

    sheet.addEventListener('touchstart', handleTouchStart, { passive: false });
    sheet.addEventListener('mousedown', handleMouseStart);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchend', handleEnd);
    document.addEventListener('mouseup', handleEnd);

    return () => {
      sheet.removeEventListener('touchstart', handleTouchStart);
      sheet.removeEventListener('mousedown', handleMouseStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchend', handleEnd);
      document.removeEventListener('mouseup', handleEnd);
    };
  }, [isOpen, isDragging, sheetHeight, onClose]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const shareToSocialMedia = (platform) => {
    const text = `Check out "${shareTitle}" on iSanzure!`;
    
    const urls = {
      'facebook': `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(text)}`,
      'twitter': `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`,
      'whatsapp': `https://wa.me/?text=${encodeURIComponent(`${text} ${shareUrl}`)}`,
      'telegram': `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(text)}`,
    };
    
    window.open(urls[platform], '_blank', 'width=600,height=500');
  };

  // Native Web Share API
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: `Check out this amazing property on iSanzure: ${shareTitle}`,
          url: shareUrl,
        });
        console.log('Successfully shared');
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      // Fallback to copying link
      handleCopyLink();
    }
  };

  const downloadQRCode = () => {
    const link = document.createElement('a');
    link.download = `isanzure-property-${property?.property_uid || 'property'}.png`;
    link.href = qrCodeUrl;
    link.click();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />
      
      {/* Bottom Sheet Modal */}
      <div
        ref={sheetRef}
        className={`fixed left-0 right-0 z-[101] bg-white rounded-t-3xl shadow-2xl transition-transform duration-300 ${
          isDragging ? 'transition-none' : ''
        }`}
        style={{
          height: sheetHeight,
          bottom: 0,
          transform: `translateY(${isOpen ? '0' : '100%'})`,
          maxHeight: '90%'
        }}
      >
        {/* Drag Handle */}
        <div className="pt-4 pb-2 flex justify-center cursor-grab active:cursor-grabbing">
          <div className="w-16 h-1.5 bg-gray-300 rounded-full"></div>
        </div>

        {/* Header */}
        <div className="px-6 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-[#BC8BBC] to-[#8A5A8A] rounded-lg">
                <Share2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Share Property</h3>
                <p className="text-sm text-gray-500">Spread the word about this amazing property</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="h-[calc(100%-85px)] overflow-y-auto pb-4">
          {/* QR Code Section */}
          <div className="px-6 py-4">
            <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-white rounded-2xl border border-gray-200">
              <div className="inline-block p-3 bg-white rounded-xl border border-gray-200 shadow-sm mb-4">
                {isGenerating ? (
                  <div className="w-32 h-32 flex items-center justify-center">
                    <div className="w-10 h-10 border-2 border-[#BC8BBC] border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <img 
                    src={qrCodeUrl} 
                    alt="QR Code" 
                    className="w-32 h-32"
                  />
                )}
              </div>
              <p className="text-sm text-gray-600 mb-4">Scan to view property details</p>
              <button
                onClick={downloadQRCode}
                disabled={isGenerating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
              >
                <Download className="h-4 w-4" />
                Download QR Code
              </button>
            </div>
          </div>

          {/* Share Options */}
          <div className="px-6 py-2">
            <h4 className="font-medium text-gray-900 mb-3 text-sm uppercase tracking-wider">Share via</h4>
            
            {/* Native Share Button */}
            <div className="mb-4">
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl hover:shadow-md transition-all duration-200 active:scale-95"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                    <SmartphoneIcon className="h-5 w-5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-gray-900">Advanced Share</div>
                    <div className="text-xs text-gray-600">Share using Advanced share features</div>
                  </div>
                </div>
                <ChevronUp className="h-5 w-5 text-blue-500 transform -rotate-90" />
              </button>
            </div>

            {/* Social Media Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              <button
                onClick={() => shareToSocialMedia('whatsapp')}
                className="flex flex-col items-center gap-2 p-4 bg-green-50 hover:bg-green-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-green-200"
              >
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">W</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">WhatsApp</span>
              </button>
              
              <button
                onClick={() => shareToSocialMedia('facebook')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-200"
              >
                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">f</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">Facebook</span>
              </button>
              
              <button
                onClick={() => shareToSocialMedia('twitter')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-200"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center">
                  <span className="text-white text-xl font-bold">𝕏</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">Twitter</span>
              </button>
              
              <button
                onClick={() => shareToSocialMedia('telegram')}
                className="flex flex-col items-center gap-2 p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 border border-blue-200"
              >
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <span className="text-white text-xl font-bold">T</span>
                </div>
                <span className="text-xs text-gray-700 font-medium">Telegram</span>
              </button>
            </div>

            {/* Copy Link Section */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
              <div className="flex items-center gap-2 mb-3">
                <LinkIcon className="h-4 w-4 text-gray-500" />
                <h4 className="text-sm font-medium text-gray-700">Copy Link</h4>
              </div>
              <div className="flex gap-2">
                <div className="flex-1">
                  <div className="px-4 py-3 bg-white rounded-lg border border-gray-300 text-sm text-gray-600 truncate">
                    {shareUrl}
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`px-4 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 min-w-[80px] justify-center ${
                    copied 
                      ? 'bg-green-100 text-green-700 border border-green-300' 
                      : 'bg-gradient-to-r from-[#BC8BBC] to-[#8A5A8A] text-white hover:opacity-90'
                  }`}
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      <span className="text-sm">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      <span className="text-sm">Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Perfect for messaging apps or email
              </p>
            </div>
          </div>

          {/* Quick Tips */}
          <div className="px-6 py-4">
            <div className="bg-gradient-to-br from-[#BC8BBC]/5 to-[#8A5A8A]/5 rounded-xl p-4 border border-[#BC8BBC]/20">
              <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4 text-[#BC8BBC]" />
                Sharing Tips
              </h4>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className="flex items-start gap-2">
                  <span className="text-[#BC8BBC] mt-1">•</span>
                  <span>QR codes work great for in-person sharing</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#BC8BBC] mt-1">•</span>
                  <span>Use Advanced Share for quick sharing to contacts</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[#BC8BBC] mt-1">•</span>
                  <span>Copy link for email or messaging apps</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}