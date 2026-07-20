import React, { useEffect, useRef, useState } from 'react';
import ChoiceButton from './ChoiceButton';
import ExploreMap from './ExploreMap';
import CircuitTraceMinigame from './CircuitTraceMinigame';
import partyMembers from '../data/partyMembers.json';
import hubMap from '../data/maps/hubMap.json';
import { getEndingById } from '../data/endings';
import { applyFlags, applyStatusChange, evaluateEnding, getActiveParty, getNode, meetsRequirements } from '../engine/storyEngine';
import { useTypewriter } from '../hooks/useTypewriter';
import { useImagePreload } from '../hooks/useImagePreload';
import { saveGame } from '../hooks/useGameSave';
import { useAnalytics } from '../hooks/useAnalytics';
import { useTranslation } from '../i18n/strings';
import '../styles/StoryContainer.css';

const DIRECTION_ARROWS = { left: '←', right: '→', down: '↓', up: '↑' };
const MAPS_BY_ID = { hub: hubMap };

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
  const [autoPlay, setAutoPlay] = useState(false);
  const [settingsToast, setSettingsToast] = useState(false);
  const [stepDirection, setStepDirection] = useState(null);
  const [examineResult, setExamineResult] = useState(null);
  const [examinedIds, setExaminedIds] = useState([]);
  const [minigameAttempt, setMinigameAttempt] = useState(0);

  const unlockedEndingRef = useRef(null);

  useEffect(() => {
    const initialNode = getNode(storyData, initialNodeId);
    if (initialNode) setNode(initialNode);
    else console.error('Invalid initialNodeId', initialNodeId);
  }, [initialNodeId, storyData]);

  const { lines, currentLine, currentText, isTextComplete, isNodeTextComplete, completeLine, advanceLine, skipToEnd } =
    useTypewriter(node, typingSpeed);

  useImagePreload(node, storyData);

  useEffect(() => {
    if (!node) return;
    if (node.background) setBackgroundImage(node.background);
    setBacklog(prev => [...prev, ...node.text.split('\n')]);
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
      if (currentLine < lines.length - 1) advanceLine();
      else if (node.nextId) goToNode(node.nextId);
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [autoPlay, isTextComplete, currentLine, lines.length, node]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!node || !isNodeTextComplete) return;
    const isEndingNode = (!node.choices || node.choices.length === 0) && !node.nextId;
    if (isEndingNode && unlockedEndingRef.current !== node.id) {
      unlockedEndingRef.current = node.id;
      onUnlockEnding?.(node.id);
      logEvent('ending_reached', { endingId: node.id });
    }
  }, [node, isNodeTextComplete]); // eslint-disable-line react-hooks/exhaustive-deps

  const goToNode = (nextId) => {
    const nextNode = getNode(storyData, nextId);
    if (nextNode) setNode(nextNode);
    else console.error('Invalid nextId:', nextId);
  };

  const handleConversationClick = () => {
    if (!node) return;
    if (currentText.length < lines[currentLine].length) { completeLine(); return; }
    if (!advanceLine() && node.nextId) goToNode(node.nextId);
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
    if (ending) { setNode(ending); return; }
    goToNode(choice.nextId);
  };

  const visibleChoices = node?.choices?.filter(choice => meetsRequirements(status, flags, choice.requires)) ?? [];
  const activeParty = getActiveParty(flags, partyMembers);
  const isExploreMode = Boolean(node?.mapId);
  const hasMinigame = Boolean(node?.minigame);
  const directionalChoices = visibleChoices.filter(choice => choice.direction);
  const otherChoices = isExploreMode ? visibleChoices.filter(choice => !choice.direction) : visibleChoices;

  const directionKeyMap = { ArrowLeft: 'left', ArrowRight: 'right', ArrowDown: 'down', ArrowUp: 'up' };
  useEffect(() => {
    if (!isNodeTextComplete || isExploreMode) return;
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
  }, [isNodeTextComplete, visibleChoices, node, status, flags]); // eslint-disable-line react-hooks/exhaustive-deps

  const lowHealthEffect = status.health <= 10 ? 'low-health' : '';
  const lowMoodEffect = status.mood <= 10 ? 'low-mood-effect-strong' : status.mood <= 30 ? 'low-mood-effect-mild' : '';

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
              <input type="range" min="0.7" max="1" step="0.01" value={conversationOpacity}
                onChange={e => setConversationOpacity(parseFloat(e.target.value))} />
            </div>

            <div className="settings-row">
              <label>{t('brightnessLabel')} <span>{brightness}</span></label>
              <input type="range" min="0.5" max="1.5" step="0.01" value={brightness}
                onChange={e => setBrightness(parseFloat(e.target.value))} />
            </div>

            <div className="settings-row">
              <label>{t('typingSpeedLabel')} <span>{typingSpeed}ms</span></label>
              <input type="range" min="10" max="120" step="5" value={typingSpeed}
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
      {isNodeTextComplete && node.examine?.length > 0 && (
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
      {isNodeTextComplete && isExploreMode && (
        <ExploreMap
          map={MAPS_BY_ID[node.mapId]}
          active={isNodeTextComplete}
          onTrigger={trigger => {
            const matchedChoice = directionalChoices.find(c => c.direction === trigger.direction);
            if (matchedChoice) handleChoiceClick(matchedChoice);
          }}
        />
      )}

      {/* ── 미니게임 ── */}
      {isNodeTextComplete && hasMinigame && node.minigame.type === 'circuitTrace' && (
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

      {/* ── 선택지 ── */}
      {isNodeTextComplete && !hasMinigame && otherChoices.length > 0 && (
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
      {isNodeTextComplete && !hasMinigame && visibleChoices.length === 0 && !node.nextId && (
        <div className="end-container">
          <p>{t('endingReached')}</p>
          <button onClick={onRestart}>{t('restartButton')}</button>
        </div>
      )}

      {/* ── 설정 저장 토스트 ── */}
      {settingsToast && <div className="vn-toast">적용되었습니다</div>}

      {/* ── 텍스트박스 (speaker name + toolbar + dialogue) ── */}
      <div className="vn-textbox-root" style={{ opacity: conversationOpacity }}>
        <div className="vn-textbox-meta">
          <div className="vn-speaker-name">{node.speaker || ''}</div>
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
              className="vn-tool-btn"
              title={t('skipButton')}
              onClick={e => { e.stopPropagation(); if (!isTextComplete) skipToEnd(); else if (node.nextId) goToNode(node.nextId); }}
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
          </div>
        </div>

        <div
          key={node.id}
          className="conversation-area conversation-area-enter"
          onClick={handleConversationClick}
          data-id={node.id}
        >
          <p className="vn-dialogue-text">{currentText}</p>
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
