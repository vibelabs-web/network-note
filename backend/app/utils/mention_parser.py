"""
Mention Parser Utility.
메모 내용에서 멘션을 파싱하고 처리하는 유틸리티 함수.
지원 형식: @멘션, [[멘션]] (Obsidian/Notion 스타일)
"""

import re


# 멘션 패턴 1: @로 시작하고 공백이나 특수문자 전까지의 텍스트
# 한글, 영문, 숫자, 하이픈, 언더스코어 지원
AT_MENTION_PATTERN = re.compile(r"@([\w가-힣\-_]+)", re.UNICODE)

# 멘션 패턴 2: [[메모명]] 형식 (Obsidian/Notion 스타일)
# [[ 와 ]] 사이의 모든 텍스트 (공백 포함)
BRACKET_MENTION_PATTERN = re.compile(r"\[\[([^\[\]]+)\]\]", re.UNICODE)


def extract_mentions(content: str) -> list[str]:
    """
    텍스트에서 멘션된 메모명을 추출합니다.
    @멘션과 [[멘션]] 두 가지 형식을 모두 지원합니다.

    Args:
        content: 메모 내용

    Returns:
        멘션된 메모명 목록 (중복 제거됨)
    """
    if not content:
        return []

    # @ 멘션 추출
    at_mentions = AT_MENTION_PATTERN.findall(content)

    # [[]] 멘션 추출
    bracket_mentions = BRACKET_MENTION_PATTERN.findall(content)

    # 모든 멘션 합치기 (앞뒤 공백 제거)
    all_mentions = [m.strip() for m in at_mentions + bracket_mentions]

    # 중복 제거하면서 순서 유지
    return list(dict.fromkeys(all_mentions))


def get_mention_diff(
    old_mentions: list[str],
    new_mentions: list[str],
) -> tuple[list[str], list[str]]:
    """
    이전 멘션과 새 멘션을 비교하여 추가/삭제된 멘션을 반환합니다.

    Args:
        old_mentions: 이전 멘션 목록
        new_mentions: 새 멘션 목록

    Returns:
        (추가된 멘션 목록, 삭제된 멘션 목록)
    """
    old_set = set(old_mentions)
    new_set = set(new_mentions)

    added = list(new_set - old_set)
    removed = list(old_set - new_set)

    return added, removed
