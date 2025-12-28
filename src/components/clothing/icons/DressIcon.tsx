import { LucideProps } from 'lucide-react';

export const DressIcon = ({ size = 24, strokeWidth = 2, className, ...props }: LucideProps) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={strokeWidth}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    {...props}
  >
    {/* Dress neckline */}
    <path d="M8 2h8l-1.5 4h-5L8 2z" />
    {/* Dress body - A-line silhouette */}
    <path d="M9.5 6h5l3 16H6.5l3-16z" />
    {/* Waist line */}
    <path d="M9 10h6" />
  </svg>
);
