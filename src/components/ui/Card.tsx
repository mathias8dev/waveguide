import { ReactNode } from 'react';

interface CardProps {
  title?: string;
  children: ReactNode;
  className?: string;
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`bg-white rounded-lg shadow-md ${className}`}>
      {title && (
        <div className="px-4 py-3 border-b border-slate-200">
          <h3 className="font-semibold text-slate-800">{title}</h3>
        </div>
      )}
      <div className="p-4">{children}</div>
    </div>
  );
}
