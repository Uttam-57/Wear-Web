import React from 'react';

const Divider = ({ className = '', text }) => {
  if (text) {
    return (
      <div className={`relative flex items-center py-5 ${className}`}>
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink-0 mx-4 text-gray-500 text-sm">{text}</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>
    );
  }

  return (
    <hr className={`my-4 border-t border-gray-300 ${className}`} />
  );
};

export default Divider;