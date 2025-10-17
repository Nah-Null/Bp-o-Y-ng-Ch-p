import styled from 'styled-components';

const Input = () => {
  return (
    <StyledWrapper>
      <div className="uiverse-pixel-input-wrapper">
        <label className="uiverse-pixel-label" htmlFor="username">USERNAME</label>
        <input placeholder="Enter name..." className="uiverse-pixel-input" id="username" type="text" />
      </div>
    </StyledWrapper>
  );
}

const StyledWrapper = styled.div`
  .uiverse-pixel-input-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5em;
    font-family: "Courier New", monospace;
    color: #fff;
    font-size: 1em;
    width: 18em;
  }

  .uiverse-pixel-label {
    text-shadow: 1px 1px #000;
    font-weight: bold;
    letter-spacing: 0.05em;
  }

  .uiverse-pixel-input {
    appearance: none;
    border: none;
    padding: 0.6em;
    font-size: 1em;
    font-family: "Courier New", monospace;
    color: #fff;
    background: #ff6b35;
    image-rendering: pixelated;
    box-shadow:
      0 0 0 0.15em #000,
      0 0 0 0.3em #fff,
      0 0 0 0.45em #000,
      0 0.3em 0 0 #d1451e,
      0 0.3em 0 0.15em #000;
    outline: none;
    transition: all 0.15s steps(1);
    text-shadow: 1px 1px #000;
  }

  .uiverse-pixel-input::placeholder {
    color: #fff;
    opacity: 0.6;
  }

  .uiverse-pixel-input:focus {
    background: #ff8c42;
    box-shadow:
      0 0 0 0.15em #000,
      0 0 0 0.3em #fff,
      0 0 0 0.45em #000,
      0 0.2em 0 0 #00cc66,
      0 0.2em 0 0.15em #000;
  }

  .uiverse-pixel-input:hover {
    animation: uiverse-glitch-input 0.3s steps(2) infinite;
  }

  /* Glitch animation */
  @keyframes uiverse-glitch-input {
    0% {
      transform: translate(0);
    }
    25% {
      transform: translate(-1px, 1px);
    }
    50% {
      transform: translate(1px, -1px);
    }
    75% {
      transform: translate(-1px, -1px);
    }
    100% {
      transform: translate(0);
    }
  }`;

export default Input;
