/**
 * Tag 컴포넌트
 * 태그 배지 표시
 */

interface TagProps {
  label: string;
  onClick?: () => void;
  onRemove?: () => void;
  isActive?: boolean;
  size?: 'sm' | 'md';
}

export function Tag({
  label,
  onClick,
  onRemove,
  isActive = false,
  size = 'sm',
}: TagProps) {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-3 py-1 text-sm',
  };

  const baseClasses = `
    inline-flex items-center gap-1 rounded-full font-medium transition-colors
    ${sizeClasses[size]}
    ${isActive
      ? 'bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400'
      : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
    }
    ${onClick ? 'cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600' : ''}
  `;

  return (
    <span className={baseClasses} onClick={onClick}>
      #{label}
      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
          className="ml-1 hover:text-red-500 transition-colors"
          aria-label={`${label} 태그 제거`}
        >
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </span>
  );
}
