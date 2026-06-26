import React, { useEffect, useRef, useState } from 'react';
import ChoiceButton from './ChoiceButton';
import ExploreMap from './ExploreMap';
import endingRules from '../data/endingRules.json';
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

// mapId -> 맵 데이터. 맵이 늘어나면 여기에만 등록하면 된다.
const MAPS_BY_ID = { hub: hubMap };

function StoryContainer({ storyKey, initialNodeId, storyData, statusData, onRestart, onUnlockEnding }) {
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
  const [conversationOpacity, setConversationOpacity] = useState(0.3);
  const [brightness, setBrightness] = useState(0.7);
  const [typingSpeed, setTypingSpeed] = useState(50);
  const [autoPlay, setAutoPlay] = useState(false);
  const [stepDirection, setStepDirection] = useState(null);
  const [examineResult, setExamineResult] = useState(null);
  const [examinedIds, setExaminedIds] = useState([]);

  const unlockedEndingRef = useRef(null);

  // --- 초기 노드 설정 ---
  useEffect(() => {
    const initialNode = getNode(storyData, initialNodeId);
    if (initialNode) {
      setNode(initialNode);
    } else {
      console.error('Invalid initialNodeId', initialNodeId);
    }
  }, [initialNodeId, storyData]);

  const { lines, currentLine, currentText, isTextComplete, isNodeTextComplete, completeLine, advanceLine, skipToEnd } =
    useTypewriter(node, typingSpeed);

  useImagePreload(node, storyData);

  // 노드가 바뀔 때마다 배경/분석 이벤트 갱신 + 백로그에 줄 누적 + 노드 자체의 패시브 statusChange/setFlags 적용
  useEffect(() => {
    if (!node) return;
    if (node.background) setBackgroundImage(node.background);
    setBacklog(prev => [...prev, ...node.text.split('\n')]);
    logEvent('node_view', { nodeId: node.id });
    unlockedEndingRef.current = null;
    setExamineResult(null);
    setExaminedIds([]);

    if (node.setFlags) setFlags(prev => applyFlags(prev, node.setFlags));

    if (node.statusChange) {
      const newStatus = applyStatusChange(status, node.statusChange);
      setStatus(newStatus);
      const endingId = evaluateEnding(newStatus, flags, endingRules);
      const ending = endingId ? getEndingById(endingId) : null;
      if (ending) setNode(ending);
    }
  }, [node]); // eslint-disable-line react-hooks/exhaustive-deps

  // 오토플레이: 한 줄이 끝나면 잠시 후 다음 줄/선택 진행
  useEffect(() => {
    if (!autoPlay || !node) return;
    if (!isTextComplete) return;
    const timeoutId = setTimeout(() => {
      if (currentLine < lines.length - 1) {
        advanceLine();
      } else if (node.nextId) {
        goToNode(node.nextId);
      }
    }, 1200);
    return () => clearTimeout(timeoutId);
  }, [autoPlay, isTextComplete, currentLine, lines.length, node]); // eslint-disable-line react-hooks/exhaustive-deps

  // 엔딩 노드(선택지도 nextId도 없는 노드)에 도달하면 도감에 1회 등록
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
    if (nextNode) {
      setNode(nextNode);
    } else {
      console.error('Invalid nextId:', nextId);
    }
  };

  const handleConversationClick = () => {
    if (!node) return;
    if (currentText.length < lines[currentLine].length) {
      completeLine();
      return;
    }
    if (!advanceLine() && node.nextId) {
      goToNode(node.nextId);
    }
  };

  const handleSkipToEnd = () => {
    if (!node) return;
    skipToEnd();
  };

  // 선택지와 별개로, 장면 속 디테일을 살펴보는 조사(examine) 행동.
  // 진행에는 영향 없이 추가 정보/단서를 보여주되, setFlags가 있으면 플래그도 반영한다.
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
    logEvent('choice_selected', { fromNodeId: node.id, nextId: choice.nextId, statusChange: choice.statusChange });

    const endingId = evaluateEnding(newStatus, newFlags, endingRules);
    const ending = endingId ? getEndingById(endingId) : null;
    if (ending) {
      setNode(ending);
      return;
    }
    goToNode(choice.nextId);
  };

  const visibleChoices = node?.choices?.filter(choice => meetsRequirements(status, flags, choice.requires)) ?? [];
  const activeParty = getActiveParty(flags, partyMembers);
  const isExploreMode = Boolean(node?.mapId);
  const directionalChoices = visibleChoices.filter(choice => choice.direction);
  const otherChoices = isExploreMode ? visibleChoices.filter(choice => !choice.direction) : visibleChoices;

  // 방향키로 직접 선택지를 고르는 기존 방식. 탐험 모드(맵)가 있는 노드는 ExploreMap이
  // 키 입력을 직접 처리하므로 여기서는 건너뛴다(중복 입력 방지).
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
      setTimeout(() => {
        handleChoiceClick(matchedChoice);
        setStepDirection(null);
      }, 220);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isNodeTextComplete, visibleChoices, node, status, flags]); // eslint-disable-line react-hooks/exhaustive-deps

  const lowHealthEffect = status.health <= 10 ? 'low-health' : '';
  const lowMoodEffect =
    status.mood <= 10 ? 'low-mood-effect-strong' :
    status.mood <= 30 ? 'low-mood-effect-mild' : '';

  const moodLabel = (mood) => {
    if (mood >= 1 && mood <= 10) return t('moodPanic');
    if (mood >= 11 && mood <= 30) return t('moodAnxious');
    if (mood >= 31 && mood <= 50) return t('moodNormal');
    if (mood >= 51 && mood <= 70) return t('moodComfortable');
    if (mood >= 71 && mood <= 90) return t('moodGood');
    if (mood >= 91 && mood <= 100) return t('moodBest');
    return 'death';
  };

  if (!node) {
    return <div>{t('loading')}</div>;
  }

  return (
    <div className={`story-container ${lowHealthEffect} ${lowMoodEffect} ${stepDirection ? `step-${stepDirection}` : ''}`} style={{
      backgroundImage: backgroundImage ? `url(${backgroundImage})` : 'none',
      filter: `brightness(${brightness})`,
    }}>
      <button className="status-button" onClick={() => setIsStatusPopupVisible(prev => !prev)}>
        {t('statusButton')}
      </button>

      {activeParty.length > 0 && (
        <div className="party-indicator">
          {t('partyTitle')}: {activeParty.map(member => member.name).join(', ')}
        </div>
      )}

      {isSettingsModalVisible && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-button" onClick={() => setIsSettingsModalVisible(false)}>{t('closeButton')}</button>
            <h2>{t('settingsTitle')}</h2>
            <label htmlFor="opacitySlider">{t('opacityLabel')}: {conversationOpacity}</label>
            <input
              type="range" id="opacitySlider" min="0" max="1" step="0.01"
              value={conversationOpacity}
              onChange={(e) => setConversationOpacity(parseFloat(e.target.value))}
            />
            <br />
            <label htmlFor="brightnessSlider">{t('brightnessLabel')}: {brightness}</label>
            <input
              type="range" id="brightnessSlider" min="0.5" max="1.5" step="0.01"
              value={brightness}
              onChange={(e) => setBrightness(parseFloat(e.target.value))}
            />
            <br />
            <label htmlFor="speedSlider">{t('typingSpeedLabel')}: {typingSpeed}ms</label>
            <input
              type="range" id="speedSlider" min="10" max="120" step="5"
              value={typingSpeed}
              onChange={(e) => setTypingSpeed(parseInt(e.target.value, 10))}
            />
            <br />
            <label htmlFor="autoPlayToggle">{t('autoPlayLabel')}</label>
            <input
              type="checkbox" id="autoPlayToggle"
              checked={autoPlay}
              onChange={(e) => setAutoPlay(e.target.checked)}
            />
            <br />
            <button onClick={() => saveGame({ storyKey, nodeId: node.id, status })}>{t('saveButton')}</button>
          </div>
        </div>
      )}

      {isStatusPopupVisible && (
        <div className="status-popup">
          <div className="status-content">
            <button className="close-button" onClick={() => setIsStatusPopupVisible(false)}>{t('closeButton')}</button>
            <h2>{t('statusTitle')}</h2>
            <p>{t('statusName')}: {status.name}</p>
            <p>{t('statusHealth')}: {status.health}</p>
            <p>{t('statusMood')}: {moodLabel(status.mood)}</p>
            <h3>{t('partyTitle')}</h3>
            {activeParty.length > 0 ? (
              <ul className="party-list">
                {activeParty.map(member => <li key={member.id}>{member.name}</li>)}
              </ul>
            ) : (
              <p>{t('partyEmpty')}</p>
            )}
          </div>
        </div>
      )}

      {isBacklogVisible && (
        <div className="modal-overlay" onClick={() => setIsBacklogVisible(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setIsBacklogVisible(false)}>{t('closeButton')}</button>
            <h2>{t('backlogTitle')}</h2>
            <div className="backlog-scroll">
              {backlog.map((line, idx) => <p key={idx}>{line}</p>)}
            </div>
          </div>
        </div>
      )}

      <div
        key={node.id}
        className="conversation-area conversation-area-enter"
        onClick={handleConversationClick}
        data-id={node.id}
        style={{ backgroundColor: `rgba(214,214,214,${conversationOpacity})` }}
      >
        <p>{currentText}</p>
        <button
          className="settings-button conversation-tool-button"
          onClick={(e) => { e.stopPropagation(); setIsSettingsModalVisible(prev => !prev); }}
        >
          {t('settingsButton')}
        </button>
        <button
          className="conversation-tool-button conversation-tool-button-skip"
          onClick={(e) => { e.stopPropagation(); handleSkipToEnd(); }}
        >
          {t('skipButton')}
        </button>
        <button
          className="conversation-tool-button conversation-tool-button-backlog"
          onClick={(e) => { e.stopPropagation(); setIsBacklogVisible(true); }}
        >
          {t('backlogButton')}
        </button>
      </div>

      {examineResult && (
        <div className="modal-overlay" onClick={() => setExamineResult(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setExamineResult(null)}>{t('closeButton')}</button>
            <h2>{examineResult.label}</h2>
            <p>{examineResult.text}</p>
          </div>
        </div>
      )}

      {isNodeTextComplete && node.examine && node.examine.length > 0 && (
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

      {isNodeTextComplete && isExploreMode && (
        <ExploreMap
          map={MAPS_BY_ID[node.mapId]}
          active={isNodeTextComplete}
          onTrigger={(trigger) => {
            const matchedChoice = directionalChoices.find(choice => choice.direction === trigger.direction);
            if (matchedChoice) handleChoiceClick(matchedChoice);
          }}
        />
      )}

      {isNodeTextComplete && otherChoices.length > 0 && (
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

      {isNodeTextComplete && visibleChoices.length === 0 && !node.nextId && (
        <div className="end-container">
          <p>{t('endingReached')}</p>
          <button onClick={onRestart}>{t('restartButton')}</button>
        </div>
      )}
    </div>
  );
}

export default StoryContainer;
