import React, { useEffect, useMemo, useRef, useState } from 'react';
import ChoiceButton from './ChoiceButton';
import CombatChoices from './CombatChoices';
import ExploreMap from './ExploreMap';
import CircuitTraceMinigame from './CircuitTraceMinigame';
import partyMembers from '../data/partyMembers.json';
import charactersData from '../data/characters.json';
import hubMap from '../data/maps/hubMap.json';
import { getEndingById } from '../data/endings';
import { applyFlags, applyStatusChange, evaluateEnding, getActiveParty, getNode, meetsRequirements } from '../engine/storyEngine';
import { useTypewriter } from '../hooks/useTypewriter';
import { useImagePreload } from '../hooks/useImagePreload';
import { saveGame } from '../hooks/useGameSave';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTranslation } from '../i18n/strings';
import '../styles/StoryContainer.css';
import '../styles/CombatChoices.css';

const DIRECTION_ARROWS = { left: '←', right: '→', down: '↓', up: '↑' };
const MAPS_BY_ID = { hub: hubMap };

// 이름 또는 ID로 캐릭터 조회 (주인공은 id "protagonist" 로 저장됨)
const SPEAKER_MAP = Object.fromEntries([
  ...Object.entries(charactersData).map(([id, c]) => [c.name, { id, ...c }]),
  ...Object.entries(charactersData).map(([id, c]) => [id, { id, ...c }]),
]);

/* ── SVG Icon Components ────────────────────────────────── */
const IconGear = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="10" cy="10" r="2.8"/>
    <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42"/>
  </svg>
);

const IconSkip = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="5,5 10,10 5,15"/>
    <polyline points="11,5 16,10 11,15"/>
  </svg>
);

const IconPlay = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <polygon points="6,4 16,10 6,16"/>
  </svg>
);

const IconBacklog = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="5" y="2" width="10" height="16" rx="1.5"/>
    <path d="M5 4h-1a1 1 0 00-1 1v11a1 1 0 001 1h1"/>
    <line x1="8" y1="7" x2="13" y2="7"/>
    <line x1="8" y1="10" x2="13" y2="10"/>
    <line x1="8" y1="13" x2="11" y2="13"/>
  </svg>
);

const IconHeart = () => (
  <svg viewBox="0 0 20 20" fill="currentColor">
    <path d="M10 16.5s-7-4.5-7-8.5a4 4 0 018-1 4 4 0 018 1c0 4-7 8.5-7 8.5z"/>
  </svg>
);

const IconClose = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <line x1="5" y1="5" x2="15" y2="15"/>
    <line x1="15" y1="5" x2="5" y2="15"/>
  </svg>
);

const IconChevronDown = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3,5 8,11 13,5"/>
  </svg>
);

const IconEye = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <ellipse cx="10" cy="10" rx="7" ry="4.5"/>
    <circle cx="10" cy="10" r="2"/>
  </svg>
);

const IconEyeOff = () => (
  <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <line x1="3" y1="3" x2="17" y2="17"/>
    <path d="M10.5 5.1A7 4.5 0 0 1 17 10M3 10a7 4.5 0 0 0 6.5 4.4"/>
  </svg>
);

/* ── 텍스트 세그먼트 파싱 (대사/서술 분리) ──────────────── */
// "..." 안은 대사(isDialogue:true), 나머지는 서술(isDialogue:false)
// 한 줄 안에 대사+서술 혼재 가능: "안녕" 그가 말했다. → 2세그먼트
function parseSegments(text) {
  const segments = [];
  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    const regex = /"[^"]*"|"[^"]*"/gu;
    let lastIndex = 0;
    let hasMatch = false;
    let match;
    while ((match = regex.exec(line)) !== null) {
      hasMatch = true;
      const before = line.slice(lastIndex, match.index).trim();
      if (before) segments.push({ text: before, isDialogue: false });
      segments.push({ text: match[0], isDialogue: true });
      lastIndex = regex.lastIndex;
    }
    if (!hasMatch) {
      segments.push({ text: line, isDialogue: false });
    } else {
      const after = line.slice(lastIndex).trim();
      if (after) segments.push({ text: after, isDialogue: false });
    }
  }
  return segments.length > 0 ? segments : [{ text: text, isDialogue: false }];
}

/* ── CharacterImage (폴백 체인 포함) ────────────────────── */
// 우선순위: {id}_{outfit}_{expression}.png → {id}_{expression}.png → {id}.png
// work 복장은 기본값이라 outfit 접두사 생략
const BASE = import.meta.env.BASE_URL.replace(/\/$/, '');

function buildFallbacks(id, expression, outfit) {
  const paths = [];
  if (outfit && outfit !== 'work' && expression)
    paths.push(`${BASE}/characters/${id}_${outfit}_${expression}.png`);
  if (expression)
    paths.push(`${BASE}/characters/${id}_${expression}.png`);
  paths.push(`${BASE}/characters/${id}.png`);
  return paths;
}

function CharacterImage({ id, expression, outfit, className, alt }) {
  const fallbacks = useMemo(
    () => buildFallbacks(id, expression, outfit),
    [id, expression, outfit]
  );
  const [idx, setIdx] = useState(0);

  useEffect(() => { setIdx(0); }, [id, expression, outfit]);

  if (!fallbacks[idx]) return null;
  return (
    <img
      src={fallbacks[idx]}
      alt={alt ?? id}
      className={className}
      onError={() => { if (idx < fallbacks.length - 1) setIdx(i => i + 1); }}
    />
  );
}

/* ── Main Component ─────────────────────────────────────── */
function StoryContainer({ storyKey, initialNodeId, storyData, statusData, endingRules = [], onRestart, onMainMenu, onUnlockEnding }) {
  const { t } = useTranslation();
  const { logEvent } = useAnalytics();

  const [node, setNode] = useState(null);
  const [status, setStatus] = useState(statusData);
  const [flags, setFlags] = useState({});
  const [backgroundImage, setBackgroundImage] = useState('');
  const [backlog, setBacklog] = useState([]);

  const [isStatusPopupVisible, setIsStatusPopupVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [isBacklogVisible, setIsBacklogVisible] = useState(false);
  const [conversationOpacity, setConversationOpacity] = useState(0.93);
  const [brightness, setBrightness] = useState(0.85);
  const [typingSpeed, setTypingSpeed] = useState(50);
  const [segmentIndex, setSegmentIndex] = useState(0);
  const [autoPlay, setAutoPlay] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [isTextboxHidden, setIsTextboxHidden] = useState(false);
  const [isDamaged, setIsDamaged] = useState(false);
  const [sceneTransition, setSceneTransition] = useState(null); // 'fade' | 'flash' | 'cross' | null
  const [textCross, setTextCross] = useState(false);
  const [settingsToast, setSettingsToast] = useState(false);
  const [stepDirection, setStepDirection] = useState(null);
  const [examineResult, setExamineResult] = useState(null);
  const [examinedIds, setExaminedIds] = useState([]);
  const [minigameAttempt, setMinigameAttempt] = useState(0);

  const unlockedEndingRef = useRef(null);
  const textRef = useRef(null);

  useEffect(() => {
    const initialNode = getNode(storyData, initialNodeId);
    if (initialNode) { setNode(initialNode); setSegmentIndex(0); }
    else console.error('Invalid initialNodeId', initialNodeId);
  }, [initialNodeId, storyData]);

  // 노드 변경 시 세그먼트 인덱스 초기화 (안전망)
  useEffect(() => { setSegmentIndex(0); }, [node]);

  const segments = useMemo(
    () => (node ? parseSegments(node.text) : [{ text: '', isDialogue: false }]),
    [node]
  );
  const currentSegment = segments[Math.min(segmentIndex, segments.length - 1)];

  // 현재 세그먼트 텍스트를 node 형태로 감싸서 기존 useTypewriter에 전달
  const virtualNode = useMemo(
    () => (node && currentSegment.text ? { ...node, text: currentSegment.text } : null),
    [currentSegment.text] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const { currentText, isTextComplete, isNodeTextComplete, completeLine, skipToEnd } =
    useTypewriter(virtualNode, typingSpeed);

  const isAllDone = isNodeTextComplete && segmentIndex >= segments.length - 1;

  useImagePreload(node, storyData);

  // 세그먼트가 바뀔 때마다 백로그에 추가
  useEffect(() => {
    if (node && currentSegment.text) {
      setBacklog(prev => [...prev, currentSegment.text]);
    }
  }, [segmentIndex, node]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!node) return;
    if (node.background) setBackgroundImage(node.background);
    logEvent('node_view', { nodeId: node.id });
    unlockedEndingRef.current = null;
    setExamineResult(null);
    setExaminedIds([]);
    setMinigameAttempt(0);
    if (node.setFlags) setFlags(prev => applyFlags(prev, node.setFlags));
    if (node.statusChange) {
      const newStatus = applyStatusChange(status, node.statusChange);
      setStatus(newStatus);
      const endingId = evaluateEnding(newStatus, flags, endingRules);
      const ending = endingId ? getEndingById(endingId) : null;
      if (ending) setNode(ending);
    }
  }, [node]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!autoPlay || !node || !isTextComplete) return;
    const timeoutId = setTimeout(() => {
      if (segmentIndex < segments.length - 1) setSegmentIndex(prev => prev + 1);
      else if (node.nextId) goToNode(node.nextId);
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [autoPlay, isTextComplete, segmentIndex, segments.length, node]); // eslint-disable-line react-hooks/exhaustive-deps

  // 스킵 모드: 텍스트 완료 시 즉시 다음 세그먼트/노드로 이동 (선택지에서 자동 중단)
  useEffect(() => {
    if (!isSkipping || !node) return;
    if (!isTextComplete) { skipToEnd(); return; }
    if (isAllDone && (node.choices?.length ?? 0) > 0) { setIsSkipping(false); return; }
    const timeoutId = setTimeout(() => {
      if (segmentIndex < segments.length - 1) setSegmentIndex(prev => prev + 1);
      else if (node.nextId) goToNode(node.nextId);
      else setIsSkipping(false);
    }, 80);
    return () => clearTimeout(timeoutId);
  }, [isSkipping, isTextComplete, segmentIndex, segments.length, node, isAllDone]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!node || !isAllDone) return;
    const isEndingNode = (!node.choices || node.choices.length === 0) && !node.nextId;
    if (isEndingNode && unlockedEndingRef.current !== node.id) {
      unlockedEndingRef.current = node.id;
      onUnlockEnding?.(node.id);
      logEvent('ending_reached', { endingId: node.id });
    }
  }, [node, isAllDone]); // eslint-disable-line react-hooks/exhaustive-deps

  const triggerDamage = () => {
    setIsDamaged(false);
    requestAnimationFrame(() => setIsDamaged(true));
    setTimeout(() => setIsDamaged(false), 600);
  };

  const getTransitionType = (currentNode, nextNode) => {
    if (!currentNode || !nextNode) return null;
    // 전투 시작 → 화이트 플래시
    if (nextNode.combatTimer && !currentNode.combatTimer) return 'flash';
    // 배경 변경 → 암전 페이드
    if (nextNode.background && nextNode.background !== currentNode.background) return 'fade';
    // 같은 배경 → 크로스페이드
    return 'cross';
  };

  const goToNode = (nextId) => {
    const nextNode = getNode(storyData, nextId);
    if (!nextNode) { console.error('Invalid nextId:', nextId); return; }

    const health = nextNode.statusChange?.health;
    if (health && parseInt(health, 10) < 0) triggerDamage();

    const tType = getTransitionType(node, nextNode);

    if (tType === 'fade') {
      setSceneTransition('fade-in');
      setTimeout(() => {
        setNode(nextNode); setSegmentIndex(0);
        setSceneTransition('fade-out');
        setTimeout(() => setSceneTransition(null), 500);
      }, 350);
    } else if (tType === 'flash') {
      setSceneTransition('flash-in');
      setTimeout(() => {
        setNode(nextNode); setSegmentIndex(0);
        setSceneTransition('flash-out');
        setTimeout(() => setSceneTransition(null), 600);
      }, 160);
    } else if (tType === 'cross') {
      setTextCross(true);
      setTimeout(() => {
        setNode(nextNode); setSegmentIndex(0);
        setTextCross(false);
      }, 300);
    } else {
      setNode(nextNode); setSegmentIndex(0);
    }
  };

  const handleConversationClick = () => {
    if (!node) return;
    if (!isTextComplete) { completeLine(); return; }
    if (segmentIndex < segments.length - 1) { setSegmentIndex(prev => prev + 1); return; }
    if (node.nextId) goToNode(node.nextId);
  };

  const handleExamine = (item) => {
    setExamineResult(item);
    setExaminedIds(prev => prev.includes(item.id) ? prev : [...prev, item.id]);
    if (item.setFlags) setFlags(prev => applyFlags(prev, item.setFlags));
    logEvent('examine', { nodeId: node.id, itemId: item.id });
  };

  const handleChoiceClick = (choice) => {
    const newStatus = applyStatusChange(status, choice.statusChange);
    const newFlags = applyFlags(flags, choice.setFlags);
    setStatus(newStatus);
    setFlags(newFlags);
    logEvent('choice_selected', { fromNodeId: node.id, nextId: choice.nextId });
    const endingId = evaluateEnding(newStatus, newFlags, endingRules);
    const ending = endingId ? getEndingById(endingId) : null;
    if (ending) { setNode(ending); setSegmentIndex(0); return; }
    goToNode(choice.nextId);
  };

  const visibleChoices = node?.choices?.filter(choice => meetsRequirements(status, flags, choice.requires)) ?? [];
  const activeParty = getActiveParty(flags, partyMembers);
  const isExploreMode = Boolean(node?.mapId);
  const hasMinigame = Boolean(node?.minigame);
  const hasCombat = Boolean(node?.combatTimer) && visibleChoices.length > 0;
  const directionalChoices = visibleChoices.filter(choice => choice.direction);
  const otherChoices = isExploreMode ? visibleChoices.filter(choice => !choice.direction) : visibleChoices;

  const directionKeyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'up' };
  useEffect(() => {
    if (!isAllDone || isExploreMode) return;
    const handleKeyDown = (event) => {
      const direction = directionKeyMap[event.key];
      if (!direction) return;
      const matchedChoice = visibleChoices.find(choice => choice.direction === direction);
      if (!matchedChoice) return;
      event.preventDefault();
      setStepDirection(direction);
      setTimeout(() => { handleChoiceClick(matchedChoice); setStepDirection(null); }, 220);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAllDone, visibleChoices, node, status, flags]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const handleSpacebar = (event) => {
      if (event.code !== 'Space') return;
      if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') return;
      event.preventDefault();
      setIsTextboxHidden(prev => !prev);
    };
    window.addEventListener('keydown', handleSpacebar);
    return () => window.removeEventListener('keydown', handleSpacebar);
  }, []);

  useEffect(() => {
    const handleCtrl = (event) => {
      if (event.key !== 'Control') return;
      setIsSkipping(true);
    };
    const handleCtrlUp = (event) => {
      if (event.key !== 'Control') return;
      setIsSkipping(false);
    };
    window.addEventListener('keydown', handleCtrl);
    window.addEventListener('keyup', handleCtrlUp);
    return () => {
      window.removeEventListener('keydown', handleCtrl);
      window.removeEventListener('keyup', handleCtrlUp);
    };
  }, []);

  const lowHealthEffect = status.health <= 10 ? 'low-health' : '';
  const lowMoodEffect = status.mood <= 10 ? 'low-mood-effect-strong' : status.mood <= 30 ? 'low-mood-effect-mild' : '';

  // 이미지가 등록된 캐릭터만 스탠딩 표시
  const standingChars = (node?.characters ?? [])
    .filter(c => charactersData[c.id]?.img);

  // 대사 세그먼트일 때만 인물명/포트레이트 표시
  const speakerChar = currentSegment.isDialogue && node?.speaker
    ? (SPEAKER_MAP[node.speaker]?.img ? SPEAKER_MAP[node.speaker] : null)
    : null;
  const speakerName = currentSegment.isDialogue
    ? (speakerChar ? speakerChar.name : (node?.speaker ?? ''))
    : '';

  const moodLabel = (mood) => {
    if (mood >= 1  && mood <= 10)  return t('moodPanic');
    if (mood >= 11 && mood <= 30)  return t('moodAnxious');
    if (mood >= 31 && mood <= 50)  return t('moodNormal');
    if (mood >= 51 && mood <= 70)  return t('moodComfortable');
    if (mood >= 71 && mood <= 90)  return t('moodGood');
    if (mood >= 91 && mood <= 100) return t('moodBest');
    return 'death';
  };

  if (!node) return <div style={{ color: '#dde8f5', padding: 20 }}>{t('loading')}</div>;

  return (
    <div
      className={`story-container ${lowHealthEffect} ${lowMoodEffect} ${stepDirection ? `step-${stepDirection}` : ''}`}
      style={{ backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none', filter: `brightness(${brightness})` }}
    >
      {/* ── 세로 모드 안내 (모바일 portrait) ── */}
      <div className="portrait-warning">
        <div className="portrait-warning-inner">
          <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <rect x="14" y="4" width="20" height="32" rx="3"/>
            <path d="M4 28l10 10 10-10" opacity="0.5"/>
            <path d="M44 20l-10-10-10 10" opacity="0.5"/>
          </svg>
          <p>기기를 가로로 돌려주세요</p>
          <span>이 게임은 가로 모드에서만 플레이할 수 있습니다</span>
        </div>
      </div>
      {/* ── 상태 버튼 (우상단 HUD) ── */}
      <button className="status-button" onClick={() => setIsStatusPopupVisible(prev => !prev)}>
        <IconHeart />
        <span>{status.health}</span>
      </button>

      {/* ── 동행 표시 ── */}
      {activeParty.length > 0 && (
        <div className="party-indicator">
          {t('partyTitle')}: {activeParty.map(m => m.name).join(', ')}
        </div>
      )}

      {/* ── 설정 모달 ── */}
      {isSettingsModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setIsSettingsModalVisible(false)}><IconClose /></button>
            <h2>{t('settingsTitle')}</h2>

            <div className="settings-row">
              <label>{t('opacityLabel')} <span>{conversationOpacity}</span></label>
              <input type="range" min="0" max="1" step="0.01" value={conversationOpacity}
                onChange={e => setConversationOpacity(parseFloat(e.target.value))} />
            </div>

            <div className="settings-row">
              <label>{t('brightnessLabel')} <span>{brightness}</span></label>
              <input type="range" min="0.5" max="1.5" step="0.01" value={brightness}
                onChange={e => setBrightness(parseFloat(e.target.value))} />
            </div>

            <div className="settings-row">
              <label>{t('typingSpeedLabel')} <span>{typingSpeed}ms</span></label>
              <input type="range" min="0" max="120" step="5" value={typingSpeed}
                onChange={e => setTypingSpeed(parseInt(e.target.value, 10))} />
            </div>

            <div className="settings-checkbox-row">
              <span>{t('autoPlayLabel')}</span>
              <input type="checkbox" checked={autoPlay} onChange={e => setAutoPlay(e.target.checked)} />
            </div>

            <button className="vn-action-btn" onClick={() => {
              saveGame({ storyKey, nodeId: node.id, status });
              setIsSettingsModalVisible(false);
              setSettingsToast(true);
              setTimeout(() => setSettingsToast(false), 2000);
            }}>
              {t('saveButton')}
            </button>
            <button className="main-menu-button" onClick={onMainMenu}>메인 메뉴</button>
          </div>
        </div>
      )}

      {/* ── 상태 팝업 ── */}
      {isStatusPopupVisible && (
        <div className="status-popup" onClick={() => setIsStatusPopupVisible(false)}>
          <div className="status-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsStatusPopupVisible(false)}><IconClose /></button>
            <p className="status-title">{t('statusTitle')}</p>

            <div className="status-name-row">
              <span className="status-name-label">{t('statusName')}</span>
              <span className="status-name-value">{status.name ?? '—'}</span>
            </div>

            <div className="vn-stat-row">
              <div className="vn-stat-header">
                <span className="vn-stat-label">{t('statusHealth')}</span>
                <span className="vn-stat-value">{status.health} / 100</span>
              </div>
              <div className="vn-stat-track">
                <div className="vn-stat-fill vn-stat-fill-health" style={{ width: `${status.health}%` }} />
              </div>
            </div>

            <div className="vn-stat-row">
              <div className="vn-stat-header">
                <span className="vn-stat-label">{t('statusMood')}</span>
                <span className="vn-stat-value">{status.mood} / 100</span>
              </div>
              <div className="vn-stat-track">
                <div className="vn-stat-fill vn-stat-fill-mood" style={{ width: `${status.mood}%` }} />
              </div>
              <div className="vn-stat-mood-label">{moodLabel(status.mood)}</div>
            </div>

            {activeParty.length > 0 && (
              <>
                <hr className="vn-divider" />
                <p className="vn-party-title">{t('partyTitle')}</p>
                <ul className="party-list">
                  {activeParty.map(member => <li key={member.id}>{member.name}</li>)}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {/* ── 백로그 모달 ── */}
      {isBacklogVisible && (
        <div className="modal-overlay" onClick={() => setIsBacklogVisible(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsBacklogVisible(false)}><IconClose /></button>
            <h2>{t('backlogTitle')}</h2>
            <div className="backlog-scroll">
              {backlog.map((line, idx) => <p key={idx}>{line}</p>)}
            </div>
          </div>
        </div>
      )}

      {/* ── 조사 결과 모달 ── */}
      {examineResult && (
        <div className="modal-overlay" onClick={() => setExamineResult(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="close-button" onClick={() => setExamineResult(null)}><IconClose /></button>
            <h2>{examineResult.label}</h2>
            <p style={{ fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--vn-text)' }}>{examineResult.text}</p>
          </div>
        </div>
      )}

      {/* ── 조사 버튼 ── */}
      {isAllDone && node.examine?.length > 0 && (
        <div className="examine-row">
          {node.examine.map(item => (
            <button
              key={item.id}
              className={`examine-button ${examinedIds.includes(item.id) ? 'examine-button-seen' : ''}`}
              onClick={() => handleExamine(item)}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}

      {/* ── 탐험 맵 ── */}
      {isAllDone && isExploreMode && (
        <ExploreMap
          map={MAPS_BY_ID[node.mapId]}
          active={isAllDone}
          onTrigger={trigger => {
            const matchedChoice = directionalChoices.find(c => c.direction === trigger.direction);
            if (matchedChoice) handleChoiceClick(matchedChoice);
          }}
        />
      )}

      {/* ── 미니게임 ── */}
      {isAllDone && hasMinigame && node.minigame.type === 'circuitTrace' && (
        <CircuitTraceMinigame
          key={`${node.id}-${minigameAttempt}`}
          difficulty={node.minigame.difficulty}
          onSuccess={() => {
            logEvent('minigame_success', { nodeId: node.id, type: node.minigame.type });
            setTimeout(() => goToNode(node.minigame.onSuccess), 700);
          }}
          onFail={() => {
            logEvent('minigame_fail', { nodeId: node.id, type: node.minigame.type });
            if (node.minigame.failMoodPenalty)
              setStatus(prev => applyStatusChange(prev, { mood: `-${node.minigame.failMoodPenalty}` }));
            setTimeout(() => setMinigameAttempt(a => a + 1), 1200);
          }}
        />
      )}

      {/* ── 피해 플래시 ── */}
      {isDamaged && <div className="damage-flash-overlay" />}

      {/* ── 씬 전환 오버레이 ── */}
      {sceneTransition && (
        <div className={`scene-transition-overlay scene-transition-${sceneTransition}`} />
      )}

      {/* ── 전투 선택지 (타이머) ── */}
      {isAllDone && hasCombat && (
        <CombatChoices
          key={node.id}
          choices={visibleChoices}
          timeLimit={node.combatTimer}
          onSelect={(choice) => handleChoiceClick(choice)}
        />
      )}

      {/* ── 선택지 ── */}
      {isAllDone && !hasMinigame && !hasCombat && otherChoices.length > 0 && (
        <div className="choices">
          {!isExploreMode && directionalChoices.length > 0 && (
            <p className="movement-hint">방향키로도 이동할 수 있습니다</p>
          )}
          {otherChoices.map(choice => (
            <ChoiceButton
              key={choice.nextId}
              text={DIRECTION_ARROWS[choice.direction] ? `${DIRECTION_ARROWS[choice.direction]} ${choice.text}` : choice.text}
              onClick={() => handleChoiceClick(choice)}
            />
          ))}
        </div>
      )}

      {/* ── 엔딩 ── */}
      {isAllDone && !hasMinigame && !hasCombat && visibleChoices.length === 0 && !node.nextId && (
        <div className="end-container">
          {node.isGameOver
            ? <p className="game-over-label">GAME OVER</p>
            : <p>{t('endingReached')}</p>
          }
          <button onClick={onRestart}>{t('restartButton')}</button>
        </div>
      )}

      {/* ── 스탠딩 이미지 ── */}
      {standingChars.length > 0 && (
        <div className="vn-standing-layer" data-count={standingChars.length}>
          {standingChars.map((c, i) => (
            <CharacterImage
              key={c.id}
              id={c.id}
              expression={c.expression}
              outfit={c.outfit}
              alt={charactersData[c.id]?.name ?? c.id}
              className={`vn-standing-img vn-standing-img--${i === 0 ? 'left' : 'right'}`}
            />
          ))}
        </div>
      )}

      {/* ── 설정 저장 토스트 ── */}
      {settingsToast && <div className="vn-toast">적용되었습니다</div>}

      {/* ── 텍스트박스 (speaker name + toolbar + dialogue) ── */}
      <div className={`vn-textbox-root${isTextboxHidden ? ' vn-textbox-hidden' : ''}${textCross ? ' vn-text-cross' : ''}`} style={{ opacity: conversationOpacity }}>
        <div className="vn-textbox-meta">
          <div className="vn-speaker-name">{speakerName}</div>
          <div className="vn-tool-buttons">
            <button
              className="vn-tool-btn"
              title={t('backlogButton')}
              onClick={e => { e.stopPropagation(); setIsBacklogVisible(true); }}
            >
              <IconBacklog />
            </button>
            <button
              className={`vn-tool-btn ${autoPlay ? 'active' : ''}`}
              title={t('autoPlayLabel')}
              onClick={e => { e.stopPropagation(); setAutoPlay(prev => !prev); }}
            >
              <IconPlay />
            </button>
            <button
              className={`vn-tool-btn ${isSkipping ? 'active' : ''}`}
              title={t('skipButton')}
              onClick={e => { e.stopPropagation(); setIsSkipping(prev => !prev); }}
            >
              <IconSkip />
            </button>
            <button
              className="vn-tool-btn"
              title={t('settingsTitle')}
              onClick={e => { e.stopPropagation(); setIsSettingsModalVisible(prev => !prev); }}
            >
              <IconGear />
            </button>
            <button
              className={`vn-tool-btn ${isTextboxHidden ? 'active' : ''}`}
              title="텍스트박스 숨기기 (Space)"
              onClick={e => { e.stopPropagation(); setIsTextboxHidden(prev => !prev); }}
            >
              {isTextboxHidden ? <IconEyeOff /> : <IconEye />}
            </button>
          </div>
        </div>

        <div
          key={node.id}
          className="conversation-area conversation-area-enter"
          onClick={handleConversationClick}
          data-id={node.id}
        >
          {speakerChar && (
            <div className="vn-portrait">
              <CharacterImage
                id={speakerChar.id}
                expression={node.characters?.find(c => c.id === speakerChar.id)?.expression}
                outfit={node.characters?.find(c => c.id === speakerChar.id)?.outfit}
                alt={speakerChar.name}
                className="vn-portrait-img"
              />
            </div>
          )}
          <div ref={textRef} className="vn-dialogue-text">{currentText}</div>
          {isTextComplete && (
            <span className="vn-advance">
              <IconChevronDown />
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default StoryContainer;
