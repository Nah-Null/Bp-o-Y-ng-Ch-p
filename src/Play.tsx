import './css/play.css'
import { useEffect, useState } from 'react'
import io, { Socket } from 'socket.io-client'
import { usePlayerCountry } from './hooks/usePlayerCountry'

const Play = () => {
  const { country, countryCode, flag, loading: countryLoading } = usePlayerCountry()
  const [socket, setSocket] = useState<Socket | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [gameStarted, setGameStarted] = useState(false)
  const [myChoice, setMyChoice] = useState<string | null>(null)
  const [opponentChoice, setOpponentChoice] = useState<string | null>(null)
  const [waiting, setWaiting] = useState(false)
  const [result, setResult] = useState<'win' | 'loss' | 'draw' | null>(null)
  const [stats, setStats] = useState({ wins: 0, losses: 0, draws: 0 })
  const [opponentName, setOpponentName] = useState('ผู้เล่นที่ 2')
  const [opponentCountry, setOpponentCountry] = useState('🌍')
  const [roomId, setRoomId] = useState('')
  const [gamePhase, setGamePhase] = useState<'selecting' | 'counting' | 'result'>('selecting')
  const [countdown, setCountdown] = useState(3)

  const choices = ['✊', '✋', '✌️']
  const choiceNames: Record<string, string> = { '✊': 'Rock', '✋': 'paper', '✌️': 'Scissors' }

  // Countdown Effect
  useEffect(() => {
    if (gamePhase === 'counting' && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    } else if (gamePhase === 'counting' && countdown === 0) {
      setGamePhase('result')
      setCountdown(3)
    }
  }, [countdown, gamePhase])

  // Socket.io Connection
  useEffect(() => {
    const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'
    
    const newSocket = io(SERVER_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: 5
    })

    newSocket.on('connect', () => {
      console.log('✅ เชื่อมต่อ Server สำเร็จ')
    })

    newSocket.on('roomCreated', (data) => {
      console.log('🏠 ห้องถูกสร้าง:', data.roomId)
      setRoomId(data.roomId)
    })

    newSocket.on('gameReady', (data) => {
      console.log('🎮 เกมพร้อมเริ่มได้', data)
      const opponent = data.players.find((p: any) => p.socketId !== newSocket.id)
      if (opponent) {
        setOpponentName(opponent.name)
        setOpponentCountry(opponent.flag || '🌍')
      }
      setWaiting(false)
    })

    newSocket.on('waitingForOpponent', (data) => {
      console.log('⏳ รอฝ่ายตรงข้ามเลือก...')
      if (myChoice) {
        setWaiting(true)
      }
    })

    newSocket.on('gameResult', (data) => {
      console.log('📊 ผลเกม:', data)
      console.log('🎮 My Socket ID:', newSocket.id)
      console.log('🎮 Player1 Socket ID:', data.player1.socketId)
      console.log('🎮 Player2 Socket ID:', data.player2.socketId)

      const isPlayer1 = newSocket.id === data.player1.socketId
      const opponent = isPlayer1 ? data.player2 : data.player1

      setOpponentName(opponent.name)
      setOpponentChoice(opponent.choice)
      setOpponentCountry(opponent.flag || '🌍')

      // คำนวณผลแพ้ชนะ
      let gameResult: 'win' | 'loss' | 'draw'
      if (data.result === 'draw') {
        gameResult = 'draw'
      } else if (
        (data.result === 'player1' && isPlayer1) ||
        (data.result === 'player2' && !isPlayer1)
      ) {
        gameResult = 'win'
      } else {
        gameResult = 'loss'
      }

      console.log(`🏆 ผลลัพธ์ของฉัน: ${gameResult}`)

      setResult(gameResult)
      setWaiting(false)
      setGamePhase('counting')
      setStats(prev => ({
        wins: prev.wins + (gameResult === 'win' ? 1 : 0),
        losses: prev.losses + (gameResult === 'loss' ? 1 : 0),
        draws: prev.draws + (gameResult === 'draw' ? 1 : 0)
      }))
    })

    newSocket.on('opponentDisconnected', () => {
      console.log('❌ ฝ่ายตรงข้ามออกไป')
      alert('ฝ่ายตรงข้ามออกจากเกม')
      resetGame()
    })

    newSocket.on('disconnect', () => {
      console.log('❌ ตัดการเชื่อมต่อจาก Server')
    })

    setSocket(newSocket)

    return () => {
      newSocket.close()
    }
  }, [])

  const startGame = () => {
    if (playerName.trim() && socket && !countryLoading) {
      setGameStarted(true)
      socket.emit('joinGame', { 
        playerName,
        country,
        countryCode,
        flag
      })
    }
  }

  const handleChoice = (choice: string) => {
    if (!socket || result || myChoice) return

    setMyChoice(choice)
    setWaiting(true)
    setGamePhase('selecting')
    socket.emit('playerChoice', { choice, playerName })
  }

  const playAgain = () => {
    setMyChoice(null)
    setOpponentChoice(null)
    setResult(null)
    setWaiting(false)
    setGamePhase('selecting')
    setCountdown(3)
    if (socket) {
      socket.emit('playAgain')
    }
  }

  const resetGame = () => {
    setGameStarted(false)
    setPlayerName('')
    setMyChoice(null)
    setOpponentChoice(null)
    setResult(null)
    setStats({ wins: 0, losses: 0, draws: 0 })
    setGamePhase('selecting')
    setCountdown(3)
  }

  // Loading state - รอให้ได้ประเทศ
  if (countryLoading) {
    return (
      <div className="play-bottom" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="game-login">
          <div style={{ textAlign: 'center', color: '#fff' }}>
            <p>⏳ กำลังตรวจสอบประเทศของคุณ...</p>
          </div>
        </div>
      </div>
    )
  }

  // Login screen
  if (!gameStarted) {
    return (
      <div className="play-bottom" style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh'
      }}>
        <div className="game-login">
          <h1>🎮 เป่ายิ่งฉุบออนไลน์</h1>
          <p>เล่นกับผู้เล่นอื่นจากทั่วโลก</p>
          <div style={{ fontSize: '32px', margin: '20px 0' }}>
            {flag} {country}
          </div>
          <div className="uiverse-pixel-input-wrapper">
            <label className="uiverse-pixel-label" htmlFor="username"></label>
            <input
              type="text"
              className="uiverse-pixel-input"
              placeholder="ชื่อของคุณ"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && startGame()}
              autoFocus
            />
          </div>
          <br />
          <button onClick={startGame} disabled={!playerName.trim()}>
            เริ่มเล่น
          </button>
        </div>
      </div>
    )
  }

  // Game screen
  return (
    <div className="play-bottom">
      <div className="game-container">
        <div className="game-header">
          <span>{flag} {playerName} (คุณ)</span>
          <span className="stats">
            ชัยชนะ: {stats.wins} | เสมอ: {stats.draws} | พ่าย: {stats.losses}
          </span>
          <span>{opponentCountry} {opponentName}</span>
        </div>

        <div className="game-area">
          {/* My Side */}
          <div className="player-side">
            <h2>คุณ {flag}</h2>
            <div className={`choice-display ${myChoice ? 'active' : ''} ${gamePhase === 'counting' || gamePhase === 'result' ? 'show' : ''}`}>
              {myChoice || '?'}
            </div>

            {!result && gamePhase === 'selecting' && (
              <div className="choices-buttons">
                {choices.map(choice => (
                  <button
                    key={choice}
                    onClick={() => handleChoice(choice)}
                    className="choice-btn"
                    disabled={myChoice !== null}
                  >
                    {choice} {choiceNames[choice]}
                  </button>
                ))}
              </div>
            )}

            {myChoice && waiting && !result && (
              <div className="waiting">
                <div className="spinner"></div>
                <p>รอฝ่ายตรงข้าม...</p>
              </div>
            )}

            {result && gamePhase === 'result' && (
              <button onClick={playAgain} className="play-again-btn">
                เล่นอีกครั้ง
                <span>↻</span>
              </button>
            )}
          </div>

          {/* Opponent Side */}
          <div className="player-side opponent">
            <h2>{opponentCountry} {opponentName}</h2>
            <div className={`choice-display ${opponentChoice ? 'active' : ''} ${gamePhase === 'counting' || gamePhase === 'result' ? 'show' : ''}`}>
              {opponentChoice || '?'}
            </div>

            {gamePhase === 'counting' && (
              <div style={{ fontSize: '60px', fontWeight: 'bold', textAlign: 'center', margin: '20px 0', color: '#facc15' }}>
                {countdown}
              </div>
            )}

            {result ? (
              <div className="result">
                <div className={`result-text ${result}`}>
                  {result === 'win' && (
                    <div className="win-result">
                      <span className="emoji">🎉</span>
                      <span className="text">ยินดีด้วย! คุณชนะ!</span>
                    </div>
                  )}
                  {result === 'loss' && (
                    <div className="loss-result">
                      <span className="emoji">😔</span>
                      <span className="text">เสียใจด้วย! คุณแพ้</span>
                    </div>
                  )}
                  {result === 'draw' && (
                    <div className="draw-result">
                      <span className="emoji">🤝</span>
                      <span className="text">เสมอกัน!</span>
                    </div>
                  )}
                </div>

                {myChoice && opponentChoice && (
                  <div className="result-detail" style={{ marginTop: '10px' }}>
                    <p>
                      คุณเลือก: <strong>{choiceNames[myChoice]}</strong> <br />
                      {opponentName} เลือก: <strong>{choiceNames[opponentChoice]}</strong>
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="waiting-text">
                {myChoice ? 'รอฝ่ายตรงข้ามเลือก...' : 'รอการเลือกของคุณ...'}
              </p>
            )}
          </div>
        </div>

        {roomId && (
          <div className="room-info">
            <p>🏠 Room ID: {roomId}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default Play