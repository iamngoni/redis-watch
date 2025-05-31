import React from 'react';
import '../global.css';

interface RouteWrapperProps {
  children: React.ReactNode;
}

export function RouteWrapper({ children }: RouteWrapperProps) {
  return (
    <div className="route-container">
      {children}
    </div>
  );
}