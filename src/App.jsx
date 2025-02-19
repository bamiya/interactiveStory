import { useState } from 'react'
import storyData from './data/storyData.json';
import StoryContainer from './components/StoryContainers'
import './App.css'

function App() {
  const [currentNodeId, setCurrentNodeId] = useState('start');

  const handleChoice = (nextId) => {
    setCurrentNodeId(nextId);
  };

  const currentNode = storyData[currentNodeId];

  return (
    <div className="App">
      <h1>인터랙티브 스토리텔링</h1>
      <StoryContainer node={currentNode} onChoice={handleChoice} />
    </div>
  );
}

export default App
