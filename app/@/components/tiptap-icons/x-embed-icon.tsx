import * as React from 'react';
export function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg width={20} height={20} viewBox="0 0 20 20" {...props}>
      <text x="50%" y="55%" textAnchor="middle" fontSize="16" fontWeight="bold" fill="currentColor" fontFamily="Arial">X</text>
    </svg>
  );
}