// src/pages/Account/WishlistPage.jsx
import { Heart, Star, MapPin, Users, Home, Trash2 } from 'lucide-react';
import { useState } from 'react';

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([
    {
      id: 1,
      title: 'Luxury Mountain Cabin',
      location: 'Aspen, Colorado',
      price: 299,
      rating: 4.9,
      reviews: 128,
      guests: 6,
      image: 'https://images.unsplash.com/photo-1582268611958-ebfd161ef9cf?auto=format&fit=crop&w=500',
      saved: true,
    },
    {
      id: 2,
      title: 'Modern Beach House',
      location: 'Malibu, California',
      price: 450,
      rating: 4.7,
      reviews: 89,
      guests: 8,
      image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=500',
      saved: true,
    },
    {
      id: 3,
      title: 'City View Penthouse',
      location: 'New York, NY',
      price: 320,
      rating: 4.8,
      reviews: 256,
      guests: 4,
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500',
      saved: true,
    },
  ]);

  const removeFromWishlist = (id) => {
    setWishlist(wishlist.filter(item => item.id !== id));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
            <p className="text-gray-600 mt-2">Your saved properties for future stays</p>
          </div>
          <Heart className="w-8 h-8 text-red-500 fill-current" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {wishlist.map((property) => (
            <div key={property.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <div className="relative">
                <img 
                  src={property.image} 
                  alt={property.title}
                  className="w-full h-56 object-cover"
                />
                <button 
                  onClick={() => removeFromWishlist(property.id)}
                  className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-5 h-5 text-red-500" />
                </button>
              </div>
              
              <div className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{property.title}</h3>
                    <div className="flex items-center mt-1 text-gray-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="text-sm">{property.location}</span>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-current mr-1" />
                    <span className="font-medium">{property.rating}</span>
                    <span className="text-gray-400 text-sm ml-1">({property.reviews})</span>
                  </div>
                </div>
                
                <div className="flex items-center mt-4 text-gray-600">
                  <Users className="w-4 h-4 mr-2" />
                  <span className="text-sm">{property.guests} guests</span>
                </div>
                
                <div className="mt-6 flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <span className="text-2xl font-bold text-gray-900">${property.price}</span>
                    <span className="text-gray-500"> / night</span>
                  </div>
                  <button className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors font-medium">
                    Book Now
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {wishlist.length === 0 && (
          <div className="text-center py-12">
            <Heart className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">Your wishlist is empty</h3>
            <p className="mt-2 text-gray-600">Start saving properties you love!</p>
          </div>
        )}
      </div>
    </div>
  );
}