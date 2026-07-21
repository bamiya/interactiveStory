import React, { useEffect, useRef, useState } from 'react';
import '../styles/CombatChoices.css';

export default function CombatChoices({ choices, timeLimit, onSelect }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [selected, setSelected] = useState(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    setTimeLeft(timeLimit);
    setSelected(null);
  }, [choices, timeLimit]);

  useEffect(() => {
    if (selected !== null) return;

    intervalRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0.05) {
          clearInterval(intervalRef.current);
          const failChoice = choices.find(c => c.onTimeout) ?? choices[choices.length - 1];
          setSelected(failChoice.nextId);
          setTimeout(() => onSelect(failChoice), 400);
          return 0;
        }
        return prev - 0.05;
      });
    }, 50);

    return () => clearInterval(intervalRef.current);
  }, [selected, choices, timeLimit, onSelect]);

  const handleClick = (choice) => {
    if (selected !== null) return;
    clearInterval(intervalRef.current);
    setSelected(choice.nextId);
    setTimeout(() => onSelect(choice), 200);
  };

  const ratio = timeLeft / timeLimit;
  const barColor = ratio > 0.5 ? '#e8c84a' : ratio > 0.25 ? '#e8944a' : '#e84a4a';

  return (
    <div className="combat-overlay">
      <div className="combat-timer-bar-bg">
        <div
          className="combat-timer-bar-fill"
          style={{ width: `${ratio * 100}%`, background: barColor }}
        />
      </div>
      <div className="combat-choices">
        {choices.map((choice) => (
          <button
            key={choice.nextId}
            className={`combat-choice-btn${selected === choice.nextId ? ' selected' : ''}${selected !== null && selected !== choice.nextId ? ' faded' : ''}`}
            onClick={() => handleClick(choice)}
            disabled={selected !== null}
          >
            {choice.text}
          </button>
        ))}
      </div>
    </div>
  );
}
