// src/components/KidProtectedRoute.jsx
import React, { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import KidModeExitHandler from "../components/layout/dashboard/viewer/kid/KidModeExitHandler";

// List of routes that are allowed in kid mode
const ALLOWED_KID_ROUTES = [
  '/',
  '/library',
  '/tv',
  '/movies', 
  '/new',
  '/browse',
  '/watch',
  '/title',
  '/my-list',
  '/search'
];

// List of routes that are strictly forbidden in kid mode
const FORBIDDEN_KID_ROUTES = [
  '/account/settings',
  '/admin',
  '/admin/overview',
  '/admin/users',
  '/admin/library',
  '/admin/subscriptions',
  '/admin/analytics',
  '/admin/global-management',
  '/admin/support',
  '/subscription',
  '/payment',
  '/downloads',
  '/profile',
  '/sample/security',
  '/sample/oliviuus'
];

export default function KidProtectedRoute({ children }) {
  const { isKidMode, kidProfile } = useAuth();
  const [showExitHandler, setShowExitHandler] = useState(false);

  // Get current path
  const currentPath = window.location.pathname;

  // Check route permissions
  const isForbiddenRoute = FORBIDDEN_KID_ROUTES.some(route => 
    currentPath.startsWith(route)
  );

  const isAllowedRoute = ALLOWED_KID_ROUTES.some(route => 
    currentPath.startsWith(route)
  );

  const isWatchOrTitleRoute = currentPath.startsWith('/watch/') || currentPath.startsWith('/title/');

  // Use effect to detect if redirect failed - ALWAYS CALLED
  useEffect(() => {
    // Only set up the timer if we're in kid mode and on a forbidden/unknown route
    if (isKidMode && (isForbiddenRoute || (!isAllowedRoute && !isWatchOrTitleRoute))) {
      const timer = setTimeout(() => {
        // If we're still on the same route after redirect attempt, show exit handler
        if (window.location.pathname === currentPath) {
          console.log(`Kid mode: Redirect failed for ${currentPath}, showing exit handler`);
          setShowExitHandler(true);
        }
      }, 100);

      return () => clearTimeout(timer);
    }
  }, [isKidMode, isForbiddenRoute, isAllowedRoute, isWatchOrTitleRoute, currentPath]);

  // If not in kid mode, allow access
  if (!isKidMode) {
    return children;
  }

  // If it's a forbidden route
  if (isForbiddenRoute) {
    console.log(`Kid mode: Redirecting from forbidden route ${currentPath} to home`);
    
    // If exit handler should be shown, show it
    if (showExitHandler) {
      return <KidModeExitHandler />;
    }

    // Otherwise, redirect to home
    return <Navigate to="/" replace />;
  }

  // If it's not explicitly allowed and not a watch/title route
  if (!isAllowedRoute && !isWatchOrTitleRoute) {
    console.log(`Kid mode: Redirecting from unknown route ${currentPath} to home`);
    
    // If exit handler should be shown, show it
    if (showExitHandler) {
      return <KidModeExitHandler />;
    }

    // Otherwise, redirect to home
    return <Navigate to="/" replace />;
  }

  // If we get here, the route is allowed in kid mode
  return children;
}