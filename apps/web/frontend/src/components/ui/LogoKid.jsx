import React from "react";
import { Helmet } from "react-helmet";
import logo from "/Oliviuus_Logo_kid_version.png";

const LogoKid = () => { // Changed component name to LogoKid for clarity
  return (
    <>
      {/* Structured Data for Logo - Updated for kid version */}
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ImageObject",
            "contentUrl": "https://oliviuus.com/logo-kid.png", 
            "creator": {
              "@type": "Organization",
              "name": "Oliviuus",
              "url": "https://oliviuus.com",
              "logo": "https://oliviuus.com/logo-kid.png"
            },
            "name": "Oliviuus Kids Logo", 
            "description": "Official kid-friendly logo of Oliviuus streaming service for children's content",
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
          alt="Oliviuus Kids - Safe & Fun Streaming for Children"
          title="Oliviuus Kids: Kid-Friendly Rwandan & African Content"
          className="w-15 h15 object-contain"
          width="60"
          height="60"
          loading="eager"
          decoding="async"
          itemProp="contentUrl"
          aria-label="Oliviuus Kids logo - Safe entertainment for children across Africa"
        />
        
        {/* Invisible text for screen readers with keywords - Updated for kids content */}
        <span className="sr-only">
          Oliviuus Kids - Safe streaming for children with educational Rwandan and African content. 
          Kid-friendly movies, cartoons, and learning videos in Kinyarwanda, English, French and Swahili.
          Parental controls and age-appropriate entertainment for young viewers in East Africa.
        </span>
      </div>
    </>
  );
};

export default LogoKid; 