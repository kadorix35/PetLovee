// Mock implementation of react-native-maps for web platform
import React from 'react';

// Mock MapView component
export const MapView = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      width: '100%',
      height: '200px',
      backgroundColor: '#f0f0f0',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      border: '1px solid #ccc',
      borderRadius: '8px',
      ...props.style
    }
  }, children || '🗺️ Harita (Web için mock)');
};

// Mock Marker component
export const Marker = ({ children, ...props }) => {
  return React.createElement('div', {
    ...props,
    style: {
      width: '20px',
      height: '20px',
      backgroundColor: '#ff0000',
      borderRadius: '50%',
      border: '2px solid #fff',
      ...props.style
    }
  }, children || '📍');
};

// Mock default export
const Maps = {
  MapView,
  Marker,
};

export default Maps;
