import React from 'react';

interface SkeletonLoaderProps {
  className?: string;
}

const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({ className }) => (
  <div className={`animate-pulse bg-muted/50 rounded-md ${className}`} />
);

export default SkeletonLoader;
