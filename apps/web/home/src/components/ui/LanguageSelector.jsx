// src/components/ui/LanguageSelector.jsx
import { useState, useEffect, useRef } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';

const languages = [
  // East African Languages
  { code: 'rw', name: 'Kinyarwanda', flag: '🇷🇼' },
  { code: 'sw', name: 'Kiswahili', flag: '🇹🇿' },
  { code: 'rn', name: 'Kirundi', flag: '🇧🇮' },
  { code: 'lg', name: 'Luganda', flag: '🇺🇬' },
  { code: 'luo', name: 'Dholuo', flag: '🇰🇪' },
  { code: 'kln', name: 'Kalenjin', flag: '🇰🇪' },
  { code: 'kam', name: 'Kamba', flag: '🇰🇪' },
  { code: 'som', name: 'Soomaali', flag: '🇸🇴' },
  { code: 'am', name: 'Amharic', flag: '🇪🇹' },
  { code: 'om', name: 'Oromoo', flag: '🇪🇹' },
  
  // Global Languages
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'nl', name: 'Nederlands', flag: '🇳🇱' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
  { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷' },
];

export default function LanguageSelector({ 
  variant = 'auto',
  position = 'auto',
  align = 'auto',
  showLabel = true,
  showFlag = true,
  onLanguageChange = null,
  className = '',
  menuClassName = '',
  buttonClassName = '',
  size = 'md',
  defaultLanguage = 'rw',
  fullWidth = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState(() => {
    const saved = localStorage.getItem('preferred-language');
    return languages.find(lang => lang.code === saved) || languages.find(lang => lang.code === defaultLanguage) || languages[0];
  });
  const [viewport, setViewport] = useState({ width: 0, height: 0 });
  const [buttonRect, setButtonRect] = useState(null);
  
  const dropdownRef = useRef(null);
  const buttonRef = useRef(null);

  // Handle viewport changes
  useEffect(() => {
    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight
      });
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Update button rect when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      setButtonRect(buttonRef.current.getBoundingClientRect());
    }
  }, [isOpen]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          buttonRef.current && !buttonRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen]);

  const handleLanguageSelect = (language) => {
    setSelectedLanguage(language);
    localStorage.setItem('preferred-language', language.code);
    setIsOpen(false);
    
    if (language.dir === 'rtl') {
      document.documentElement.dir = 'rtl';
    } else {
      document.documentElement.dir = 'ltr';
    }
    
    if (onLanguageChange) {
      onLanguageChange(language);
    }
  };

  // Determine variant based on viewport
  const getVariant = () => {
    if (variant !== 'auto') return variant;
    if (viewport.width < 380) return 'icon';
    if (viewport.width < 640) return 'compact';
    return 'full';
  };

  // Calculate dropdown position
  const getDropdownStyles = () => {
    if (!buttonRect || !isOpen) return {};

    const menuWidth = Math.min(280, viewport.width - 32);
    const menuHeight = Math.min(400, viewport.height - 100);
    
    let top, left;
    
    // Vertical positioning
    const spaceBelow = viewport.height - buttonRect.bottom;
    const spaceAbove = buttonRect.top;
    
    if (position === 'top' || (position === 'auto' && spaceAbove > spaceBelow && spaceAbove > 200)) {
      top = buttonRect.top - menuHeight - 8;
    } else {
      top = buttonRect.bottom + 8;
    }

    // Horizontal positioning
    if (align === 'center') {
      left = buttonRect.left + (buttonRect.width / 2) - (menuWidth / 2);
    } else if (align === 'end') {
      left = buttonRect.right - menuWidth;
    } else {
      left = buttonRect.left;
    }

    // Ensure menu stays within viewport
    left = Math.max(8, Math.min(left, viewport.width - menuWidth - 8));
    top = Math.max(8, Math.min(top, viewport.height - menuHeight - 8));

    return {
      position: 'fixed',
      top: `${top}px`,
      left: `${left}px`,
      width: `${menuWidth}px`,
      maxHeight: `${menuHeight}px`,
      zIndex: 9999,
    };
  };

  const currentVariant = getVariant();

  // Size mappings
  const sizeStyles = {
    sm: { button: 'px-2 py-1.5 text-xs', globe: 14, chevron: 12, flag: 'text-base' },
    md: { button: 'px-3 py-2 text-sm', globe: 16, chevron: 14, flag: 'text-lg' },
    lg: { button: 'px-4 py-2.5 text-base', globe: 18, chevron: 16, flag: 'text-xl' },
  };

  const currentSize = sizeStyles[size] || sizeStyles.md;

  // Button styles
  const getButtonStyles = () => {
    const baseStyles = `
      flex items-center justify-center transition-all duration-200 rounded-lg
      ${fullWidth ? 'w-full' : ''}
      hover:bg-gray-100 active:bg-gray-200
      focus:outline-none focus:ring-2 focus:ring-[#BC8BBC] focus:ring-offset-2
      ${currentSize.button}
      ${buttonClassName}
    `;

    switch (currentVariant) {
      case 'icon':
        return `${baseStyles} rounded-full p-2`;
      case 'compact':
        return `${baseStyles} border border-gray-200 gap-1`;
      default:
        return `${baseStyles} border border-gray-200 gap-2`;
    }
  };

  // Render button content
  const renderButtonContent = () => {
    return (
      <>
        <Globe size={currentSize.globe} className="text-gray-500" />
        
        {currentVariant !== 'icon' && (
          <>
            {showFlag && (
              <span className={currentSize.flag}>{selectedLanguage.flag}</span>
            )}
            
            {showLabel && currentVariant === 'full' && (
              <span className="font-medium text-gray-700 truncate max-w-[80px] sm:max-w-[100px]">
                {viewport.width < 768 ? selectedLanguage.flag : selectedLanguage.name}
              </span>
            )}
            
            <ChevronDown 
              size={currentSize.chevron} 
              className={`
                text-gray-400 transition-transform duration-200
                ${isOpen ? 'rotate-180' : ''}
              `} 
            />
          </>
        )}
      </>
    );
  };

  return (
    <div className={`relative ${className} ${fullWidth ? 'w-full' : 'inline-block'}`}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={getButtonStyles()}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        aria-label="Select language"
      >
        {renderButtonContent()}
      </button>

      {isOpen && (
        <div
          ref={dropdownRef}
          style={getDropdownStyles()}
          className={`
            bg-white rounded-xl shadow-2xl border border-gray-200 py-2
            overflow-y-auto overscroll-contain
            animate-in fade-in zoom-in-95 duration-200
            ${menuClassName}
          `}
          role="listbox"
        >
          {/* Simple header */}
          <div className="px-4 py-2 border-b border-gray-100 mb-1">
            <h3 className="font-medium text-gray-900">Select language</h3>
          </div>

          {/* Simple list - no region headers */}
          {languages.map((language) => (
            <button
              key={language.code}
              onClick={() => handleLanguageSelect(language)}
              className={`
                w-full px-4 py-3 flex items-center gap-3
                transition-all duration-150
                hover:bg-gray-50 active:bg-gray-100
                ${selectedLanguage.code === language.code ? 'bg-[#BC8BBC]/5' : ''}
                ${language.dir === 'rtl' ? 'flex-row-reverse' : ''}
              `}
              role="option"
              aria-selected={selectedLanguage.code === language.code}
            >
              <span className="text-xl min-w-[28px]">{language.flag}</span>
              <span className={`
                flex-1 text-left text-sm font-medium
                ${selectedLanguage.code === language.code ? 'text-[#BC8BBC]' : 'text-gray-700'}
              `}>
                {language.name}
              </span>
              {selectedLanguage.code === language.code && (
                <Check size={16} className="text-[#BC8BBC]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}