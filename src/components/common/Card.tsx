import { HTMLAttributes, forwardRef } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'bordered' | 'gradient';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hover?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      children,
      variant = 'default',
      padding = 'md',
      hover = false,
      className = '',
      ...props
    },
    ref
  ) => {
    const baseStyles = `
      rounded-2xl transition-all duration-300 ease-out
    `;

    const variants = {
      default: 'bg-dark-800 border border-dark-600',
      elevated: 'bg-dark-800 shadow-xl shadow-black/20',
      bordered: 'bg-dark-800/50 border-2 border-dark-500',
      gradient: `
        bg-gradient-to-br from-dark-700 via-dark-800 to-dark-900
        border border-dark-600
      `,
    };

    const paddings = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const hoverStyles = hover
      ? 'hover:border-dark-400 hover:shadow-lg hover:shadow-black/30 hover:-translate-y-0.5 cursor-pointer'
      : '';

    return (
      <div
        ref={ref}
        className={`${baseStyles} ${variants[variant]} ${paddings[padding]} ${hoverStyles} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = 'Card';

// Card Header component
export const CardHeader = ({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`flex items-center justify-between mb-4 ${className}`}
    {...props}
  >
    {children}
  </div>
);

// Card Title component
export const CardTitle = ({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLHeadingElement>) => (
  <h3
    className={`text-lg font-semibold text-white ${className}`}
    {...props}
  >
    {children}
  </h3>
);

// Card Content component
export const CardContent = ({
  children,
  className = '',
  ...props
}: HTMLAttributes<HTMLDivElement>) => (
  <div className={`${className}`} {...props}>
    {children}
  </div>
);

export default Card;

