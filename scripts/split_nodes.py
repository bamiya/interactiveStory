"""
arkStory.json 노드 분리 스크립트 (교대 화자 배정 포함)

규칙:
- 대사 세그먼트: 교대 패턴으로 speaker 배정
    1번째 대사 → node.speaker
    2번째 대사 → 주인공(protagonist) 또는 scene의 다른 캐릭터
    3번째 대사 → node.speaker
    ...
- 서술 세그먼트: speaker 없음
- background, characters 는 모든 분리 노드에 복사
- choices, nextId, examine 등은 마지막 노드에만
- setFlags, statusChange 는 첫 번째 노드에만
"""
import json
import re
from copy import deepcopy

INPUT  = "C:/Projects/interactiveStory/src/data/arkStory.backup.json"
OUTPUT = "C:/Projects/interactiveStory/src/data/arkStory.json"

QUOTE_RE = re.compile(r'[""][^""]*[""]')

# characters.json 에서 이름→id 역방향 맵
CHAR_DATA = json.load(open("C:/Projects/interactiveStory/src/data/characters.json", encoding="utf-8"))
NAME_TO_ID = {v["name"]: k for k, v in CHAR_DATA.items() if v.get("name")}


def parse_segments(text):
    segments = []
    for raw_line in text.split('\n'):
        line = raw_line.strip()
        if not line:
            continue
        last_index = 0
        has_match = False
        for m in QUOTE_RE.finditer(line):
            has_match = True
            before = line[last_index:m.start()].strip()
            if before:
                segments.append({'text': before, 'isDialogue': False})
            segments.append({'text': m.group(), 'isDialogue': True})
            last_index = m.end()
        if not has_match:
            segments.append({'text': line, 'isDialogue': False})
        else:
            after = line[last_index:].strip()
            if after:
                segments.append({'text': after, 'isDialogue': False})
    return segments if segments else [{'text': text, 'isDialogue': False}]


def get_speaker_cycle(node_speaker_name, characters_in_scene):
    """
    교대 화자 순서 결정.
    node.speaker → 주인공 → node.speaker → ...
    단, scene에 node.speaker 외 다른 named character가 있으면
    그 캐릭터를 주인공 대신 (또는 주인공 다음에) 배치.

    반환: [speaker_name, speaker_name, ...] 무한 반복용 리스트 (최소 2개)
    """
    # scene의 characters 중 node_speaker 제외한 나머지
    speaker_id = NAME_TO_ID.get(node_speaker_name)
    others = [c["id"] for c in characters_in_scene
              if c["id"] != speaker_id]

    if not others:
        # 1:1 대화 → 주인공과 교대
        return [node_speaker_name, "protagonist"]
    else:
        # 다른 named character 있음 → 그 캐릭터와 교대
        # (주인공도 끼어들 수 있으나 우선 단순하게: speaker ↔ first_other)
        other_name = CHAR_DATA.get(others[0], {}).get("name") or others[0]
        return [node_speaker_name, other_name]


def split_node(node):
    text = node.get('text', '')
    segs = parse_segments(text)

    # 분리 불필요
    types = set(s['isDialogue'] for s in segs)
    if len(segs) <= 1 or len(types) == 1 and not any(s['isDialogue'] for s in segs):
        node['id'] = node.get('id') or list(node.keys())[0]
        return [node]

    # 모두 같은 타입이면 분리 불필요
    if len(types) == 1:
        return [node]

    shared = {k: node[k] for k in ('background', 'characters') if k in node}
    exit_fields = {k: node[k] for k in ('nextId', 'choices', 'examine', 'mapId', 'minigame') if k in node}
    entry_fields = {k: node[k] for k in ('setFlags', 'statusChange') if k in node}

    base_id = node['id']
    node_speaker = node.get('speaker', '')
    characters_in_scene = node.get('characters', [])
    speaker_cycle = get_speaker_cycle(node_speaker, characters_in_scene) if node_speaker else []

    result = []
    dialogue_idx = 0  # 대사 순번 (교대 카운터)

    for i, seg in enumerate(segs):
        is_first = (i == 0)
        is_last  = (i == len(segs) - 1)

        new_node = {}
        new_node['id'] = base_id if is_first else f"{base_id}_s{i}"
        new_node.update(shared)

        if is_first:
            new_node.update(entry_fields)

        if seg['isDialogue'] and speaker_cycle:
            assigned = speaker_cycle[dialogue_idx % len(speaker_cycle)]
            # protagonist 는 speaker 필드에 "protagonist" 대신 id로 저장
            # StoryContainer의 SPEAKER_MAP은 이름→캐릭터 매핑이므로
            # protagonist는 이름이 "" → 별도 처리 필요
            # → speaker 필드에 id를 직접 쓰는 대신, 이름 기반 SPEAKER_MAP 우회를 위해
            #   protagonist 는 특별 키 "protagonist" 를 사용하고
            #   SPEAKER_MAP에도 "" 키로 등록되도록 함.
            #   여기서는 일단 캐릭터 이름(name)을 speaker로 저장.
            new_node['speaker'] = assigned
            dialogue_idx += 1
        # 서술이면 speaker 없음

        new_node['text'] = seg['text']

        if is_last:
            new_node.update(exit_fields)
        else:
            new_node['nextId'] = base_id if i + 1 == 0 else f"{base_id}_s{i+1}"

        result.append(new_node)

    return result


def main():
    data = json.load(open(INPUT, encoding='utf-8'))

    new_data = {}
    split_count = 0
    warn_nodes = []

    for node_id, node in data.items():
        if not isinstance(node, dict):
            new_data[node_id] = node
            continue

        node['id'] = node_id
        segs = parse_segments(node.get('text', ''))
        types = set(s['isDialogue'] for s in segs)
        needs = len(segs) > 1 and len(types) > 1

        if not needs:
            new_data[node_id] = node
            continue

        split_nodes = split_node(node)
        split_count += 1

        # 3인 이상 대화 → 경고
        dialogue_count = sum(1 for s in segs if s['isDialogue'])
        chars = node.get('characters', [])
        speaker_id = NAME_TO_ID.get(node.get('speaker', ''))
        others = [c for c in chars if c['id'] != speaker_id]
        if dialogue_count >= 4 and len(others) >= 1:
            warn_nodes.append(node_id)

        for sn in split_nodes:
            new_data[sn['id']] = sn

    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(new_data, f, ensure_ascii=False, indent=2)

    print(f"완료: {split_count}개 분리 → 총 {len(new_data)}개 노드 (원본 {len(data)}개)")

    if warn_nodes:
        print(f"\n3인 이상 대화 수동 확인 권장 ({len(warn_nodes)}개):")
        for nid in warn_nodes:
            print(f"  - {nid}")


if __name__ == '__main__':
    main()
