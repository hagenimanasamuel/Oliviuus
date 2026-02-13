// backend/services/isanzure/availabilityService.js
const { isanzureQuery } = require('../../config/isanzureDbConfig');

class AvailabilityService {
  
  // 🔍 MAIN CHECK - Run before allowing payment
async checkPropertyAvailability(propertyId, startDate, endDate) {
    // For ghettos and commercial buildings:
    // IGNORE dates completely!
    // Just check if ANYONE is living there
    
    const sql = `
      SELECT COUNT(*) as active_tenants
      FROM bookings 
      WHERE property_id = ?
        AND status IN ('pending', 'confirmed', 'active')
    `;
    
    const result = await isanzureQuery(sql, [propertyId]);
    const isOccupied = result[0].active_tenants > 0;
    
    if (isOccupied) {
      return {
        available: false,
        message: 'This property is currently occupied',
        code: 'PROPERTY_OCCUPIED'
      };
    }
    
    return {
      available: true,
      message: 'Property is available',
      code: 'PROPERTY_AVAILABLE'
    };
  }


  // 📅 Check overlapping bookings
  async checkExistingBookings(propertyId, startDate, endDate, excludeBookingId = null) {
    const sql = `
      SELECT 
        COUNT(*) as booking_count,
        GROUP_CONCAT(DISTINCT status) as statuses
      FROM bookings 
      WHERE property_id = ?
        AND status IN ('pending', 'confirmed', 'active')
        AND (
          (start_date <= ? AND end_date >= ?) OR
          (start_date BETWEEN ? AND ?) OR
          (end_date BETWEEN ? AND ?)
        )
        ${excludeBookingId ? 'AND id != ?' : ''}
    `;

    const params = excludeBookingId 
      ? [propertyId, endDate, startDate, startDate, endDate, startDate, endDate, excludeBookingId]
      : [propertyId, endDate, startDate, startDate, endDate, startDate, endDate];

    const results = await isanzureQuery(sql, params);
    const booking = results[0];

    if (booking.booking_count > 0) {
      return {
        available: false,
        reason: 'PROPERTY_NOT_AVAILABLE',
        message: 'This property is already booked for the selected dates',
        details: {
          count: booking.booking_count,
          statuses: booking.statuses
        }
      };
    }

    return { available: true };
  }

  // 🏠 Check property status
  async checkPropertyStatus(propertyId) {
    const sql = `
      SELECT status
      FROM properties 
      WHERE id = ?
    `;
    
    const results = await isanzureQuery(sql, [propertyId]);
    
    if (results.length === 0) {
      return {
        available: false,
        reason: 'PROPERTY_NOT_FOUND',
        message: 'Property does not exist'
      };
    }

    const property = results[0];

    if (property.status !== 'active') {
      return {
        available: false,
        reason: 'PROPERTY_INACTIVE',
        message: `This property is currently ${property.status}`,
        details: { status: property.status }
      };
    }

    return { available: true };
  }

  // 👤 Check if user already has a booking for this property
  async checkUserDuplicateBooking(userId, propertyId, startDate, endDate, excludeBookingId = null) {
    if (!userId) return { available: true };

    const sql = `
      SELECT 
        COUNT(*) as duplicate_count,
        GROUP_CONCAT(DISTINCT status) as statuses,
        GROUP_CONCAT(DISTINCT DATE_FORMAT(start_date, '%Y-%m-%d')) as booked_dates
      FROM bookings
      WHERE tenant_id = ?
        AND property_id = ?
        AND status IN ('pending', 'confirmed', 'active')
        AND (
          (start_date <= ? AND end_date >= ?) OR
          (start_date BETWEEN ? AND ?) OR
          (end_date BETWEEN ? AND ?)
        )
        ${excludeBookingId ? 'AND id != ?' : ''}
    `;

    const params = excludeBookingId
      ? [userId, propertyId, endDate, startDate, startDate, endDate, startDate, endDate, excludeBookingId]
      : [userId, propertyId, endDate, startDate, startDate, endDate, startDate, endDate];

    const results = await isanzureQuery(sql, params);

    if (results[0].duplicate_count > 0) {
      return {
        available: false,
        reason: 'DUPLICATE_BOOKING',
        message: 'You already have a booking for this property during these dates',
        details: {
          count: results[0].duplicate_count,
          statuses: results[0].statuses,
          dates: results[0].booked_dates
        }
      };
    }

    return { available: true };
  }
}

module.exports = new AvailabilityService();