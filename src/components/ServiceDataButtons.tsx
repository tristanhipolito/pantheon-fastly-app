// app/components/ServiceDataButtons.tsx
'use client'; // Required since we're using hooks and interactivity

import Link from 'next/link';
import { useParams } from 'next/navigation';

interface ServiceDataButtonsProps {
  service: {
    id: string;
    active_version: string | number;
  };
  className?: string;
}

export default function ServiceDataButtons({ 
  service,
  className = '' 
}: ServiceDataButtonsProps) {
  return (
    <div className={`flex gap-4 ${className}`}>
      <Link
        href={`/services/${service.id}/version/${service.active_version}/data/acl`}
        className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-48"
      >
        <div className="text-left">
          <div className="font-bold text-gray-800">Access Control List</div>
        </div>
      </Link>

      <Link
        href={`/services/${service.id}/version/${service.active_version}/data/dictionary`}
        className="bg-white border-2 border-gray-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow w-48"
      >
        <div className="text-left">
          <div className="font-bold text-gray-800">Dictionary</div>
        </div>
      </Link>
    </div>
  );
}