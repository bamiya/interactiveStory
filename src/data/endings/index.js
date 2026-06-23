// endings 폴더에 새 JSON 파일만 추가하면 자동으로 registry에 포함된다.
// (storyEngine의 endingRules.json에서 endingId로 참조)
const modules = import.meta.glob('./*.json', { eager: true });

const endingsById = {};
for (const path in modules) {
  const ending = modules[path].default ?? modules[path];
  if (ending?.id) {
    endingsById[ending.id] = ending;
  }
}

export function getEndingById(endingId) {
  return endingsById[endingId];
}

export function getAllEndingIds() {
  return Object.keys(endingsById);
}
