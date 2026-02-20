// src/components/ui/Footer.jsx
import { 
  Facebook, 
  Twitter, 
  Instagram, 
  Linkedin, 
  Youtube,
  Globe
} from 'lucide-react';
import Logo from './Logo';
import LanguageSelector from './LanguageSelector';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const footerSections = [
    {
      title: 'Support',
      links: [
        { label: 'Help Center', href: '#' },
        { label: 'Safety information', href: '#' },
        { label: 'Cancellation options', href: '#' },
        { label: 'Report a concern', href: '#' },
      ]
    },
    {
      title: 'Hosting',
      links: [
        { label: 'List your property', href: '#' },
        { label: 'Become an agent', href: '#' },
        { label: 'Hosting resources', href: '#' },
        { label: 'Community forum', href: '#' },
      ]
    },
    {
      title: 'iSanzure',
      links: [
        { label: 'Newsroom', href: '#' },
        { label: 'Careers', href: '#' },
        { label: 'Investors', href: '#' },
        { label: 'Gift cards', href: '#' },
      ]
    },
  ];

  const legalLinks = [
    { label: 'Privacy', href: '#' },
    { label: 'Terms', href: '#' },
    { label: 'Contact', href: '#' },
    { label: 'About', href: '#' },
  ];

  const socialLinks = [
    { icon: <Facebook size={18} />, href: '#', label: 'Facebook' },
    { icon: <Twitter size={18} />, href: '#', label: 'Twitter' },
    { icon: <Instagram size={18} />, href: '#', label: 'Instagram' },
    { icon: <Linkedin size={18} />, href: '#', label: 'LinkedIn' },
    { icon: <Youtube size={18} />, href: '#', label: 'YouTube' },
  ];

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-12">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand */}
          <div>
            <Logo />
            <p className="text-sm text-gray-500 mt-4">
              Rwanda's trusted property marketplace.
            </p>
          </div>

          {/* Footer Sections */}
          {footerSections.map((section, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-900 mb-4">{section.title}</h3>
              <ul className="space-y-3">
                {section.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href={link.href} 
                      className="text-sm text-gray-500 hover:text-gray-900 transition-colors"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            
            {/* Copyright and Legal Links */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span>© {currentYear} Oliviuus Ltd.</span>
              <span className="text-gray-300">·</span>
              {legalLinks.map((link, index) => (
                <span key={index} className="flex items-center">
                  <a href={link.href} className="hover:text-gray-900 transition-colors">
                    {link.label}
                  </a>
                  {index < legalLinks.length - 1 && (
                    <span className="text-gray-300 mx-2">·</span>
                  )}
                </span>
              ))}
            </div>

            {/* Right side - Language and Social */}
            <div className="flex items-center gap-6">
              
              {/* Language Selector - Using your custom component */}
              <LanguageSelector 
                variant="compact"
                position="top"
                align="end"
                showLabel={false}
                size="sm"
              />

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social, index) => (
                  <a
                    key={index}
                    href={social.href}
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label={social.label}
                  >
                    {social.icon}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}