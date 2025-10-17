import './css/App.css'
import Button from './component/button'
import { useState } from 'react'
import styled from 'styled-components'

const StyledWrapper = styled.div<{ $isTransitioning: boolean }>`
  .content {
    transition: all 0.5s ease-in-out;
    opacity: ${props => props.$isTransitioning ? 0 : 1};
    transform: scale(${props => props.$isTransitioning ? 1.2 : 1});
  }
  
  .fade-out {
    pointer-events: none;
  }
`

function App() {
  const [isTransitioning, setIsTransitioning] = useState(false)

  const handleTransition = () => {
    setIsTransitioning(true)
  }

  return (
    <StyledWrapper $isTransitioning={isTransitioning}>
      <div className={`content ${isTransitioning ? 'fade-out' : ''}`}>
        <div className="loader">
          <div data-glitch="Bpào Yîng Chùp" className="glitch">
            <h1>Bpào Yîng Chùp</h1>
          </div>
        </div>
        <div className="start-button">
          <Button text="START" part="/play" onTransition={handleTransition}></Button>
        </div>
        <div className="start-button" >
          <Button text="Leaderboard" part="/Leaderboard" onTransition={handleTransition}></Button>
        </div>
      </div>
    </StyledWrapper>
  )
}

export default App
