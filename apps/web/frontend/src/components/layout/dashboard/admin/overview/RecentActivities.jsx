import React from 'react';
import { User, CreditCard, DollarSign, HelpCircle, Clock } from 'lucide-react';

// Helper function to format user identifier for display
const formatUserIdentifier = (user) => {
  if (!user) return 'User';
  
  // Priority: username > full name > email prefix > phone > fallback
  if (user.username) return `@${user.username}`;
  
  if (user.first_name) {
    return `${user.first_name} ${user.last_name || ''}`.trim();
  }
  
  if (user.email) {
    return user.email.split('@')[0];
  }
  
  if (user.phone) {
    return `User (${user.phone.substring(user.phone.length - 4)})`;
  }
  
  return 'User';
};

// Helper function to get primary identifier (email, phone, or username)
const getPrimaryIdentifier = (user) => {
  if (!user) return 'No identifier';
  
  if (user.email) return user.email;
  if (user.phone) return user.phone;
  if (user.username) return `@${user.username}`;
  
  return 'No identifier';
};

export default function RecentActivities({ data }) {
  const activities = data?.recentActivities || [];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'user_registered':
        return <User className="w-4 h-4 text-green-500" />;
      case 'subscription_created':
        return <CreditCard className="w-4 h-4 text-blue-500" />;
      case 'payment_completed':
        return <DollarSign className="w-4 h-4 text-purple-500" />;
      case 'support_ticket':
        return <HelpCircle className="w-4 h-4 text-orange-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'user_registered':
        return 'bg-green-500/20 border-green-500/30';
      case 'subscription_created':
        return 'bg-blue-500/20 border-blue-500/30';
      case 'payment_completed':
        return 'bg-purple-500/20 border-purple-500/30';
      case 'support_ticket':
        return 'bg-orange-500/20 border-orange-500/30';
      default:
        return 'bg-gray-500/20 border-gray-500/30';
    }
  };

  const formatTime = (timestamp) => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffInHours = Math.floor((now - activityTime) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    return `${Math.floor(diffInHours / 24)}d ago`;
  };

  // Process activities to format user identifiers properly
  const processedActivities = activities.map(activity => {
    let formattedDescription = activity.description;
    
    // If this is a user registration activity, format the user identifier
    if (activity.type === 'user_registered' && activity.user) {
      const user = activity.user;
      const userDisplayName = formatUserIdentifier(user);
      const primaryIdentifier = getPrimaryIdentifier(user);
      
      formattedDescription = `New user registered: ${userDisplayName} (${primaryIdentifier})`;
    }
    
    // If this is a subscription activity and has user info
    if (activity.type === 'subscription_created' && activity.user) {
      const user = activity.user;
      const userDisplayName = formatUserIdentifier(user);
      
      // Extract subscription name from description or use default
      const subscriptionName = activity.subscription_name || 'subscription';
      formattedDescription = `${userDisplayName} created a new ${subscriptionName}`;
    }
    
    return {
      ...activity,
      formattedDescription: formattedDescription || activity.description
    };
  });

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-xl p-6">
      <h3 className="text-xl font-semibold text-white mb-4">Recent Activities</h3>
      
      <div className="space-y-3 max-h-80 overflow-y-auto">
        {processedActivities.length > 0 ? (
          processedActivities.map((activity, index) => (
            <div 
              key={index} 
              className={`p-3 rounded-lg border ${getActivityColor(activity.type)} transition-colors hover:bg-gray-750/50`}
            >
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 mt-0.5">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">
                    {activity.formattedDescription}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-gray-400 text-xs capitalize">
                      {activity.type.replace('_', ' ')}
                    </span>
                    <span className="text-gray-500 text-xs">
                      {formatTime(activity.timestamp)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Clock className="w-8 h-8 mx-auto mb-2" />
            <p>No recent activities</p>
          </div>
        )}
      </div>
    </div>
  );
}