import logoImage from '../../../public/iSanzure_Homes_Logo(Text).png'; 

export default function Logo() {
  return (
    <div className="flex items-center">
      <img 
        src={logoImage} 
        alt="iSanzure Logo" 
        className="h-30 w-auto object-contain"
      />
    </div>
  );
}

