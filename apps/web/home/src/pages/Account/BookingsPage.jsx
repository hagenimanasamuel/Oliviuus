// src/pages/Account/BookingsPage.jsx
import { Calendar, Home, MapPin, Clock, ArrowRight } from 'lucide-react';

export default function BookingsPage() {
  const bookings = [
    {
      id: 1,
      property: 'Modern Luxury Villa',
      location: 'Bali, Indonesia',
      checkIn: '2024-12-15',
      checkOut: '2024-12-22',
      status: 'Confirmed',
      image: 'https://images.unsplash.com/photo-1613977257363-707ba9348227?auto=format&fit=crop&w=500',
    },
    {
      id: 2,
      property: 'Urban Studio Apartment',
      location: 'Tokyo, Japan',
      checkIn: '2024-11-10',
      checkOut: '2024-11-15',
      status: 'Upcoming',
      image: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=500',
    },
    {
      id: 3,
      property: 'Beachfront Bungalow',
      location: 'Maldives',
      checkIn: '2024-10-05',
      checkOut: '2024-10-12',
      status: 'Completed',
      image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Bookings</h1>
            <p className="text-gray-600 mt-2">Manage and view all your property reservations</p>
          </div>
          <Calendar className="w-8 h-8 text-purple-600" />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {bookings.map((booking) => (
            <div key={booking.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 hover:shadow-xl transition-shadow duration-300">
              <div className="relative h-48">
                <img 
                  src={booking.image} 
                  alt={booking.property}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-semibold ${
                  booking.status === 'Confirmed' ? 'bg-green-100 text-green-800' :
                  booking.status === 'Upcoming' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {booking.status}
                </div>
              </div>
              
              <div className="p-6">
                <h3 className="text-xl font-semibold text-gray-900">{booking.property}</h3>
                
                <div className="flex items-center mt-2 text-gray-600">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span className="text-sm">{booking.location}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Check-in</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{booking.checkIn}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Check-out</p>
                    <div className="flex items-center mt-1">
                      <Clock className="w-4 h-4 mr-2 text-gray-400" />
                      <span className="font-medium">{booking.checkOut}</span>
                    </div>
                  </div>
                </div>
                
                <button className="w-full mt-6 flex items-center justify-center gap-2 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 transition-colors font-medium">
                  View Details
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {bookings.length === 0 && (
          <div className="text-center py-12">
            <Home className="w-16 h-16 text-gray-300 mx-auto" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No bookings yet</h3>
            <p className="mt-2 text-gray-600">Start exploring properties to make your first booking!</p>
          </div>
        )}
      </div>
    </div>
  );
}