// LandingPage.js
import Header from '../../components/LandingPage/Header/Header';
import PropertyListings from './PropertyListings';
import Footer from '../../components/ui/Footer';
import BottomNav from '../../components/LandingPage/BottomNav/BottomNav';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 w-full">
      <Header />
      <main className="w-full">
        <PropertyListings />
      </main>
      <Footer />
      <BottomNav />
    </div>
  );
}