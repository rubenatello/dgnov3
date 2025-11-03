import { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons';

interface ExpandableDescriptionProps {
  description: string;
  maxLength?: number;
}

export default function ExpandableDescription({ 
  description, 
  maxLength = 100 
}: ExpandableDescriptionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!description) return <span className="text-gray-400">-</span>;
  
  const shouldTruncate = description.length > maxLength;
  const displayText = shouldTruncate && !isExpanded 
    ? `${description.substring(0, maxLength)}...` 
    : description;

  if (!shouldTruncate) {
    return <span>{description}</span>;
  }

  return (
    <div className="space-y-2">
      <div className="leading-relaxed">
        {displayText}
      </div>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-1 transition-colors font-medium bg-blue-50 hover:bg-blue-100 px-2 py-1 rounded-full"
      >
        <FontAwesomeIcon 
          icon={isExpanded ? faChevronUp : faChevronDown} 
          className="text-xs"
        />
        {isExpanded ? 'Show Less' : 'Read More'}
      </button>
    </div>
  );
}