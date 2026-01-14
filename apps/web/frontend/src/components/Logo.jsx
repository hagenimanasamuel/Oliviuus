import React from "react";
import { Helmet } from "react-helmet";
import logo from "../assets/oliviuus_logo_transparent.png";


const Logo = () => {
  return (
    <>
      {/* Structured Data for Logo */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "contentUrl": "https://oliviuus.com/logo.png",
            "creator": {
              "@type": "Organization",
              "name": "Oliviuus",
              "url": "https://oliviuus.com",
              "logo": "https://oliviuus.com/logo.png"
            },
            "name": "Oliviuus Logo",
            "description": "Official logo of Oliviuus streaming service",
            "license": "https://oliviuus.com/terms",
            "acquireLicensePage": "https://oliviuus.com/brand-guidelines"
          })}
        </script>
        
        {/* Preconnect for better performance */}
        <link rel="preconnect" href="https://oliviuus.com" />
        
        {/* Preload logo for faster loading */}
        <link 
          rel="preload" 
          href={logo} 
          as="image" 
          type="image/png"
          fetchpriority="high"
        />
      </Helmet>

      <div className="flex items-center justify-center" itemScope itemType="https://schema.org/ImageObject">
        <img
          src={logo}
          alt="Oliviuus - Rwandan Streaming Service & African Entertainment Platform"
          title="Oliviuus: Stream Rwandan Movies & Global Content"
          className="w-15 h15 object-contain"
          width="60"
          height="60"
          loading="eager"
          decoding="async"
          itemProp="contentUrl"
          // Improved alt text for SEO
          aria-label="Oliviuus streaming platform logo - African stories meet global stage"
        />
        
        {/* Invisible text for screen readers with keywords */}
        <span className="sr-only">
          Oliviuus - Stream unlimited Rwandan movies, global and African entertainment. 
          Affordable streaming service in Rwanda and East Africa. Watch films online in Kinyarwanda, English, French and Swahili.
        </span>
      </div>
    </>
  );
};

export default Logo;