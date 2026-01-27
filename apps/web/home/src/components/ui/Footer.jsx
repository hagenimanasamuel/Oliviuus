export default function Footer() {
  const footerLinks = [
    { label: 'Privacy Policy', href: '#' },
    { label: 'Terms of Service', href: '#' },
    { label: 'Contact Us', href: '#' },
    { label: 'About', href: '#' },
  ];

  const footerCategories = [
    { title: 'Discover', links: ['Kigali', 'Rubavu', 'Musanze', 'Huye', 'Karongi'] },
    { title: 'Types', links: ['Villas', 'Apartments', 'Houses', 'Huts', 'Studios'] },
    { title: 'Support', links: ['Help Center', 'Safety Info', 'Cancellation', 'Report Issue'] },
  ];

  return (
    <footer className="mt-16 border-t border-gray-200 bg-white">
      <div className="container mx-auto px-4 py-8">
        
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg"></div>
              <span className="text-2xl font-bold text-gray-800">iSanzure</span>
            </div>
            <p className="text-gray-600 text-sm">
              Your trusted platform for finding and booking unique homes across Rwanda.
            </p>
          </div>

          {/* Categories */}
          {footerCategories.map((category, index) => (
            <div key={index}>
              <h3 className="font-semibold text-gray-800 mb-4">{category.title}</h3>
              <ul className="space-y-2">
                {category.links.map((link, linkIndex) => (
                  <li key={linkIndex}>
                    <a 
                      href="#" 
                      className="text-gray-600 hover:text-blue-600 text-sm transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Footer */}
        <div className="pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <p className="text-gray-500 text-sm">
                © 2024 iSanzure Rwanda. All rights reserved.
              </p>
            </div>
            <div className="flex space-x-6 text-sm text-gray-600">
              {footerLinks.map((link, index) => (
                <a 
                  key={index}
                  href={link.href} 
                  className="hover:text-blue-600 transition-colors"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}