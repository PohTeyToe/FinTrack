interface LoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const Loader = ({ size = 'md', className = '' }: LoaderProps) => {
  const sizes = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12',
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div
        className={`${sizes[size]} border-2 border-dark-500 border-t-accent rounded-full animate-spin`}
      />
    </div>
  );
};

// Skeleton loader for content placeholders
interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
}

export const Skeleton = ({
  className = '',
  variant = 'text',
  width,
  height,
}: SkeletonProps) => {
  const baseStyles = `
    bg-gradient-to-r from-dark-600 via-dark-500 to-dark-600
    bg-[length:200%_100%] animate-shimmer
  `;

  const variants = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded-lg',
  };

  const style = {
    width: width ? (typeof width === 'number' ? `${width}px` : width) : undefined,
    height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
  };

  return (
    <div
      className={`${baseStyles} ${variants[variant]} ${className}`}
      style={style}
    />
  );
};

// Card skeleton for loading states
export const CardSkeleton = () => (
  <div className="bg-dark-800 rounded-2xl p-6 border border-dark-600">
    <div className="flex items-center justify-between mb-4">
      <Skeleton width={120} height={24} variant="rectangular" />
      <Skeleton width={80} height={20} variant="rectangular" />
    </div>
    <Skeleton width="100%" height={40} variant="rectangular" className="mb-3" />
    <div className="space-y-2">
      <Skeleton width="80%" />
      <Skeleton width="60%" />
    </div>
  </div>
);

// Table row skeleton
export const TableRowSkeleton = () => (
  <div className="flex items-center justify-between py-4 border-b border-dark-600">
    <div className="flex items-center gap-3">
      <Skeleton width={40} height={40} variant="circular" />
      <div>
        <Skeleton width={80} height={16} className="mb-1" />
        <Skeleton width={120} height={12} />
      </div>
    </div>
    <div className="text-right">
      <Skeleton width={60} height={16} className="mb-1" />
      <Skeleton width={40} height={12} />
    </div>
  </div>
);

// Full page loader
export const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-dark-900">
    <div className="text-center">
      <Loader size="lg" className="mb-4" />
      <p className="text-gray-400 animate-pulse">Loading...</p>
    </div>
  </div>
);

export default Loader;

