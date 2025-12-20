/**
 * MarkdownPreview 컴포넌트
 * 마크다운 콘텐츠를 렌더링하여 미리보기 표시
 * @멘션 및 [[멘션]] (Obsidian/Notion 스타일)을 클릭 가능한 링크로 변환
 */

import { useMemo, ReactNode, Children, isValidElement, cloneElement } from 'react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useMemoStore } from '@/stores/memoStore';

interface MarkdownPreviewProps {
  content: string;
  className?: string;
  onMentionClick?: (mentionName: string, memoId?: string) => void;
}

// 멘션 패턴: @ 또는 [[]] 형식
// 두 패턴을 하나의 정규식으로 처리
const COMBINED_MENTION_REGEX = /@([\w가-힣\-_]+)|\[\[([^\[\]]+)\]\]/g;

// 멘션 타입
type MentionMatch = {
  type: 'at' | 'bracket';
  name: string;
  fullMatch: string;
  index: number;
};

// 텍스트에서 모든 멘션 찾기
function findAllMentions(text: string): MentionMatch[] {
  const matches: MentionMatch[] = [];
  COMBINED_MENTION_REGEX.lastIndex = 0;

  let match;
  while ((match = COMBINED_MENTION_REGEX.exec(text)) !== null) {
    if (match[1]) {
      // @ 멘션
      matches.push({
        type: 'at',
        name: match[1],
        fullMatch: match[0],
        index: match.index,
      });
    } else if (match[2]) {
      // [[]] 멘션
      matches.push({
        type: 'bracket',
        name: match[2].trim(),
        fullMatch: match[0],
        index: match.index,
      });
    }
  }

  return matches;
}

// 텍스트에서 멘션을 찾아 React 요소로 변환
function processMentions(
  text: string,
  memoMap: Map<string, string>,
  onMentionClick: (name: string, id?: string) => void
): ReactNode[] {
  const parts: ReactNode[] = [];
  const mentions = findAllMentions(text);

  let lastIndex = 0;

  for (const mention of mentions) {
    // 멘션 이전 텍스트
    if (mention.index > lastIndex) {
      parts.push(text.slice(lastIndex, mention.index));
    }

    const memoId = memoMap.get(mention.name.toLowerCase());

    // 멘션 링크
    parts.push(
      <button
        key={`mention-${mention.index}`}
        onClick={(e) => {
          e.preventDefault();
          onMentionClick(mention.name, memoId);
        }}
        className="text-blue-400 hover:text-blue-300 hover:underline font-medium inline-flex items-center gap-0.5 transition-colors"
      >
        {mention.type === 'at' ? (
          <>
            <span className="text-blue-500">@</span>
            {mention.name}
          </>
        ) : (
          <>
            <span className="text-blue-500/70">[[</span>
            {mention.name}
            <span className="text-blue-500/70">]]</span>
          </>
        )}
      </button>
    );

    lastIndex = mention.index + mention.fullMatch.length;
  }

  // 남은 텍스트
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }

  return parts;
}

// 재귀적으로 children 처리하여 멘션 변환
function processChildren(
  children: ReactNode,
  memoMap: Map<string, string>,
  onMentionClick: (name: string, id?: string) => void
): ReactNode {
  return Children.map(children, (child) => {
    if (typeof child === 'string') {
      return processMentions(child, memoMap, onMentionClick);
    }

    if (isValidElement(child) && child.props.children) {
      return cloneElement(child, {
        ...child.props,
        children: processChildren(child.props.children, memoMap, onMentionClick),
      });
    }

    return child;
  });
}

export function MarkdownPreview({
  content,
  className = '',
  onMentionClick,
}: MarkdownPreviewProps) {
  const navigate = useNavigate();
  const { memos } = useMemoStore();

  // 메모 제목 -> ID 맵 생성 (대소문자 무시)
  const memoMap = useMemo(() => {
    const map = new Map<string, string>();
    memos.forEach((memo) => {
      map.set(memo.title.toLowerCase(), memo.id);
    });
    return map;
  }, [memos]);

  // 멘션 클릭 핸들러
  const handleMentionClick = (mentionName: string, memoId?: string) => {
    if (onMentionClick) {
      onMentionClick(mentionName, memoId);
    } else if (memoId) {
      navigate(`/memos/${memoId}`);
    }
  };

  return (
    <div
      className={`prose prose-sm dark:prose-invert max-w-none ${className}`}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // 모든 텍스트 노드에서 멘션 처리
          p: ({ children }) => (
            <p>{processChildren(children, memoMap, handleMentionClick)}</p>
          ),
          li: ({ children }) => (
            <li>{processChildren(children, memoMap, handleMentionClick)}</li>
          ),
          td: ({ children }) => (
            <td>{processChildren(children, memoMap, handleMentionClick)}</td>
          ),
          th: ({ children }) => (
            <th>{processChildren(children, memoMap, handleMentionClick)}</th>
          ),
          blockquote: ({ children }) => (
            <blockquote>
              {processChildren(children, memoMap, handleMentionClick)}
            </blockquote>
          ),
          // 헤딩에서도 멘션 처리
          h1: ({ children }) => (
            <h1>{processChildren(children, memoMap, handleMentionClick)}</h1>
          ),
          h2: ({ children }) => (
            <h2>{processChildren(children, memoMap, handleMentionClick)}</h2>
          ),
          h3: ({ children }) => (
            <h3>{processChildren(children, memoMap, handleMentionClick)}</h3>
          ),
          h4: ({ children }) => (
            <h4>{processChildren(children, memoMap, handleMentionClick)}</h4>
          ),
          h5: ({ children }) => (
            <h5>{processChildren(children, memoMap, handleMentionClick)}</h5>
          ),
          h6: ({ children }) => (
            <h6>{processChildren(children, memoMap, handleMentionClick)}</h6>
          ),
          // 링크를 새 탭에서 열기
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:text-blue-300"
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
                  className="px-1.5 py-0.5 bg-[#3c3c3c] rounded text-sm font-mono text-gray-300"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <code
                className={`${className} block p-4 bg-[#2d2d2d] rounded-lg overflow-x-auto`}
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
                  className="mr-2 rounded border-gray-600"
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
