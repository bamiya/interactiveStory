import { useState } from 'react'
import storyData from './data/storyData.json';
import MainScreen from './components/MainScreen';
import './App.css'

function App() {
  const [currentNodeId, setCurrentNodeId] = useState('start');

  const handleChoice = (nextId) => {
    setCurrentNodeId(nextId);
  };

  const currentNode = storyData[currentNodeId];

  return (
    <div className="App">
      <MainScreen />
    </div>
  );
}

export default App
