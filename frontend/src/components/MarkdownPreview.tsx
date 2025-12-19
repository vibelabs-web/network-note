/**
 * MarkdownPreview 컴포넌트
 * 마크다운 콘텐츠를 렌더링하여 미리보기 표시
 */

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className = '' }: MarkdownPreviewProps) {
  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 커스텀 렌더러: @멘션 스타일링
          p: ({ children }) => {
            // p 태그 내용에서 @멘션 찾아서 강조
            if (typeof children === 'string') {
              const parts = children.split(/(@[\w가-힣]+)/g);
              return (
                <p>
                  {parts.map((part, i) =>
                    part.startsWith('@') ? (
                      <span
                        key={i}
                        className="text-primary-500 font-medium hover:underline cursor-pointer"
                      >
                        {part}
                      </span>
                    ) : (
                      part
                    )
                  )}
                </p>
              );
            }
            return <p>{children}</p>;
          },
          // 링크를 새 탭에서 열기
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-500 hover:text-primary-600"
            >
              {children}
            </a>
          ),
          // 코드 블록 스타일링
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-800 rounded text-sm font-mono"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${className} block p-4 bg-gray-900 dark:bg-gray-950 rounded-lg overflow-x-auto`}
                {...props}
              >
                {children}
              </code>
            );
          },
          // 체크박스 (GFM)
          input: ({ type, checked, ...props }) => {
            if (type === 'checkbox') {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mr-2 rounded border-gray-300 dark:border-gray-600"
                  {...props}
                />
              );
            }
            return <input type={type} {...props} />;
          },
        }}
      >
        {content || '*내용이 없습니다*'}
      </ReactMarkdown>
    </div>
  );
}
