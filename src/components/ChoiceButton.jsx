import React from 'react';

function ChoiceButton({ text, onClick }) {
  return (
    <button onClick={onClick} className="choice-button">
      {text}
    </button>
  );
}

export default ChoiceButton;
