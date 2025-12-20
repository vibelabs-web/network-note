/**
 * Mention Parser Utility
 * 텍스트에서 멘션을 파싱하고 처리하는 유틸리티 함수
 * 지원 형식: @멘션, [[멘션]] (Obsidian/Notion 스타일)
 */

// 멘션 패턴 1: @로 시작하고 공백이나 특수문자 전까지의 텍스트
const AT_MENTION_PATTERN = /@([\w가-힣\-_]+)/gu;

// 멘션 패턴 2: [[메모명]] 형식 (Obsidian/Notion 스타일)
const BRACKET_MENTION_PATTERN = /\[\[([^\[\]]+)\]\]/gu;

// 멘션 타입
export type MentionType = 'at' | 'bracket';

// 현재 입력 중인 멘션 정보
export interface CurrentMention {
  mention: string;
  startIndex: number;
  endIndex: number;
  type: MentionType;
}

/**
 * 텍스트에서 멘션된 메모명을 추출합니다.
 * @멘션과 [[멘션]] 두 가지 형식을 모두 지원합니다.
 */
export function extractMentions(content: string): string[] {
  if (!content) return [];

  const mentions: string[] = [];

  // @ 멘션 추출
  AT_MENTION_PATTERN.lastIndex = 0;
  let match;
  while ((match = AT_MENTION_PATTERN.exec(content)) !== null) {
    mentions.push(match[1].trim());
  }

  // [[]] 멘션 추출
  BRACKET_MENTION_PATTERN.lastIndex = 0;
  while ((match = BRACKET_MENTION_PATTERN.exec(content)) !== null) {
    mentions.push(match[1].trim());
  }

  // 중복 제거하면서 순서 유지
  return [...new Set(mentions)];
}

/**
 * 텍스트에서 커서 위치 기준으로 현재 입력 중인 멘션을 찾습니다.
 * @ 또는 [[ 트리거를 모두 감지합니다.
 */
export function getCurrentMention(
  text: string,
  cursorPosition: number
): CurrentMention | null {
  const textBeforeCursor = text.slice(0, cursorPosition);

  // 1. [[ 패턴 확인 (우선순위 높음)
  const lastBracketIndex = textBeforeCursor.lastIndexOf('[[');
  if (lastBracketIndex !== -1) {
    // [[ 이후부터 커서까지의 텍스트
    const afterBracket = textBeforeCursor.slice(lastBracketIndex + 2);

    // [[ 이후에 ]] 가 있으면 이미 완성된 멘션
    if (!afterBracket.includes(']]')) {
      // 줄바꿈이 없어야 함
      if (!afterBracket.includes('\n')) {
        // 커서 이후에서 ]] 찾기
        const textAfterCursor = text.slice(cursorPosition);
        const closingIndex = textAfterCursor.indexOf(']]');
        const continuingText =
          closingIndex !== -1
            ? textAfterCursor.slice(0, closingIndex)
            : textAfterCursor.split('\n')[0].split(']]')[0];

        return {
          mention: afterBracket + continuingText,
          startIndex: lastBracketIndex,
          endIndex:
            cursorPosition +
            continuingText.length +
            (closingIndex !== -1 ? 2 : 0),
          type: 'bracket',
        };
      }
    }
  }

  // 2. @ 패턴 확인
  const lastAtIndex = textBeforeCursor.lastIndexOf('@');
  if (lastAtIndex !== -1) {
    // @ 이후부터 커서까지의 텍스트
    const afterAt = textBeforeCursor.slice(lastAtIndex + 1);

    // @ 이후에 공백이나 줄바꿈이 있으면 멘션 입력 중이 아님
    if (!/[\s]/.test(afterAt)) {
      // 멘션 패턴과 일치하는지 확인 (부분 일치도 허용)
      if (/^[\w가-힣\-_]*$/.test(afterAt)) {
        // 커서 이후의 텍스트에서 멘션이 계속되는지 확인
        const textAfterCursor = text.slice(cursorPosition);
        const continuingMatch = textAfterCursor.match(/^[\w가-힣\-_]*/);
        const continuingText = continuingMatch ? continuingMatch[0] : '';

        return {
          mention: afterAt + continuingText,
          startIndex: lastAtIndex,
          endIndex: cursorPosition + continuingText.length,
          type: 'at',
        };
      }
    }
  }

  return null;
}

/**
 * 멘션 텍스트를 삽입합니다.
 * 멘션 타입에 따라 @메모명 또는 [[메모명]] 형식으로 삽입합니다.
 */
export function insertMention(
  text: string,
  startIndex: number,
  endIndex: number,
  mentionTitle: string,
  type: MentionType = 'at'
): { newText: string; newCursorPosition: number } {
  const before = text.slice(0, startIndex);
  const after = text.slice(endIndex);

  // 타입에 따라 형식 결정
  const mentionText =
    type === 'bracket' ? `[[${mentionTitle}]]` : `@${mentionTitle}`;

  return {
    newText: before + mentionText + ' ' + after,
    newCursorPosition: before.length + mentionText.length + 1,
  };
}

/**
 * 멘션 변경 사항을 계산합니다.
 */
export function getMentionDiff(
  oldMentions: string[],
  newMentions: string[]
): { added: string[]; removed: string[] } {
  const oldSet = new Set(oldMentions);
  const newSet = new Set(newMentions);

  const added = newMentions.filter((m) => !oldSet.has(m));
  const removed = oldMentions.filter((m) => !newSet.has(m));

  return { added, removed };
}
