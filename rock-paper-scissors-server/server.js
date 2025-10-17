const express = require('express')
const http = require('http')
const socketIO = require('socket.io')
const cors = require('cors')
require('dotenv').config()

const app = express()
const server = http.createServer(app)
const io = socketIO(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.use(express.json())

// เก็บข้อมูลผู้เล่นและห้อง
const players = new Map()
const rooms = new Map()
const leaderboard = new Map() // key: countryCode, value: { country, countryCode, flag, wins, losses, draws }

// Route ทดสอบ
app.get('/', (req, res) => {
  res.json({ message: '✅ Server เรียบร้อย' })
})

// Get Leaderboard ทั้งโลก
app.get('/api/leaderboard', (req, res) => {
  const leaderboardArray = Array.from(leaderboard.entries())
    .map(([countryCode, stats]) => ({
      countryCode,
      country: stats.country,
      flag: stats.flag,
      wins: stats.wins,
      losses: stats.losses,
      draws: stats.draws
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 100)

  res.json(leaderboardArray)
})

// Get Leaderboard ประเทศเดียว
app.get('/api/leaderboard/:countryCode', (req, res) => {
  const { countryCode } = req.params
  const stats = leaderboard.get(countryCode)

  if (!stats) {
    return res.status(404).json({ error: 'Country not found' })
  }

  res.json(stats)
})

// Socket.io Events
io.on('connection', (socket) => {
  console.log(`👤 ผู้เล่นใหม่เชื่อมต่อ: ${socket.id}`)

  // ผู้เล่นเข้าร่วมเกม
  socket.on('joinGame', (data) => {
    const { playerName, country = 'Unknown', countryCode = 'XX', flag = '🌍' } = data

    // เก็บข้อมูลผู้เล่น
    players.set(socket.id, {
      name: playerName,
      country,
      countryCode,
      flag,
      socketId: socket.id,
      choice: null,
      ready: false
    })

    // สร้าง Leaderboard ประเทศถ้าไม่มี
    if (!leaderboard.has(countryCode)) {
      leaderboard.set(countryCode, {
        country,
        countryCode,
        flag,
        wins: 0,
        losses: 0,
        draws: 0
      })
    }

    // ค้นหาห้องว่าง
    let foundRoom = null
    for (let [roomId, room] of rooms) {
      if (room.players.length === 1) {
        foundRoom = roomId
        break
      }
    }

    // สร้างห้องใหม่ถ้าไม่มี
    if (!foundRoom) {
      foundRoom = `room-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      rooms.set(foundRoom, {
        players: [],
        gameState: null,
        startTime: null
      })
    }

    // เพิ่มผู้เล่นเข้าห้อง
    const room = rooms.get(foundRoom)
    room.players.push({
      socketId: socket.id,
      name: playerName,
      country,
      countryCode,
      flag,
      choice: null
    })

    // เข้า Socket.io room
    socket.join(foundRoom)

    // บอก Client ว่าสร้างห้องสำเร็จ
    socket.emit('roomCreated', { roomId: foundRoom })

    // ถ้าจำนวนผู้เล่นครบ 2 คน ให้เล่นเกมได้
    if (room.players.length === 2) {
      io.to(foundRoom).emit('gameReady', {
        players: room.players.map(p => ({
          name: p.name,
          country: p.country,
          countryCode: p.countryCode,
          flag: p.flag,
          socketId: p.socketId
        }))
      })
    }

    console.log(`✅ ผู้เล่น ${playerName} (${countryCode}) เข้าห้อง ${foundRoom}`)
  })

  // ผู้เล่นเลือก
  socket.on('playerChoice', (data) => {
    const { choice } = data

    // หาห้องของผู้เล่นนี้
    let roomId = null
    for (let [rid, room] of rooms) {
      const player = room.players.find(p => p.socketId === socket.id)
      if (player) {
        roomId = rid
        player.choice = choice
        break
      }
    }

    if (!roomId) return

    const room = rooms.get(roomId)
    const bothChosen = room.players.every(p => p.choice !== null)

    // ถ้าทั้งสองเลือกแล้ว คำนวณผลแพ้ชนะ
    if (bothChosen && room.players.length === 2) {
      const player1 = room.players[0]
      const player2 = room.players[1]

      // ตรวจสอบว่าทั้งสองคนยังอยู่ในห้องและมีการเลือก
      if (player1?.choice && player2?.choice) {
        const result = getGameResult(player1.choice, player2.choice)

        // อัปเดต Leaderboard ถ้าทั้งสองประเทศมีอยู่
        if (leaderboard.has(player1.countryCode) && leaderboard.has(player2.countryCode)) {
          if (result === 'player1') {
            leaderboard.get(player1.countryCode).wins++
            leaderboard.get(player2.countryCode).losses++
          } else if (result === 'player2') {
            leaderboard.get(player2.countryCode).wins++
            leaderboard.get(player1.countryCode).losses++
          } else {
            leaderboard.get(player1.countryCode).draws++
            leaderboard.get(player2.countryCode).draws++
          }
        }

        // ส่งผลแพ้ชนะให้ผู้เล่น
        io.to(roomId).emit('gameResult', {
          player1: {
            name: player1.name,
            choice: player1.choice,
            country: player1.country,
            countryCode: player1.countryCode,
            flag: player1.flag,
            socketId: player1.socketId
          },
          player2: {
            name: player2.name,
            choice: player2.choice,
            country: player2.country,
            countryCode: player2.countryCode,
            flag: player2.flag,
            socketId: player2.socketId
          },
          result,
          leaderboard: {
            [player1.countryCode]: leaderboard.get(player1.countryCode),
            [player2.countryCode]: leaderboard.get(player2.countryCode)
          }
        })

        // รีเซ็ตการเลือก
        player1.choice = null
        player2.choice = null
      }
    } else {
      // ส่งให้ฝ่ายตรงข้ามรู้ว่า 1 คนเลือกแล้ว
      socket.broadcast.to(roomId).emit('waitingForOpponent', {
        message: 'ผู้เล่นคนหนึ่งเลือกแล้ว รอคนโน้นด้วย...'
      })
    }
  })

  // ผู้เล่นเล่นอีกครั้ง
  socket.on('playAgain', () => {
    let roomId = null
    for (let [rid, room] of rooms) {
      if (room.players.find(p => p.socketId === socket.id)) {
        roomId = rid
        break
      }
    }

    if (roomId) {
      io.to(roomId).emit('readyForNextRound')
    }
  })

  // ผู้เล่นออกจากเกม
  socket.on('disconnect', () => {
    console.log(`❌ ผู้เล่นออกไป: ${socket.id}`)

    // หาห้องและลบผู้เล่น
    for (let [roomId, room] of rooms) {
      const playerIndex = room.players.findIndex(p => p.socketId === socket.id)
      if (playerIndex !== -1) {
        const disconnectedPlayer = room.players[playerIndex]
        room.players.splice(playerIndex, 1)

        // ส่งแจ้งเตือนให้ฝ่ายตรงข้าม
        if (room.players.length > 0) {
          io.to(roomId).emit('opponentDisconnected', {
            message: 'ผู้เล่นอีกคนออกจากเกม'
          })
        }

        // ลบห้องถ้าไม่มีผู้เล่น
        if (room.players.length === 0) {
          rooms.delete(roomId)
        }
        break
      }
    }

    players.delete(socket.id)
  })

  // ดึงข้อมูลสถิติของประเทศ
  socket.on('getCountryStats', (data) => {
    const { countryCode } = data
    const stats = leaderboard.get(countryCode) || {
      country: 'Unknown',
      countryCode,
      flag: '🌍',
      wins: 0,
      losses: 0,
      draws: 0
    }
    socket.emit('countryStats', stats)
  })

  // ดึงข้อมูลผู้เล่นทั้งหมด (สำหรับ Debug)
  socket.on('getActivePlayers', () => {
    const activePlayersArray = Array.from(players.values()).map(p => ({
      name: p.name,
      country: p.country,
      countryCode: p.countryCode,
      flag: p.flag
    }))
    socket.emit('activePlayersInfo', activePlayersArray)
  })
})

// ฟังก์ชันคำนวณแพ้ชนะ
function getGameResult(choice1, choice2) {
  if (choice1 === choice2) return 'draw'

  if (
    (choice1 === '✊' && choice2 === '✌️') ||
    (choice1 === '✋' && choice2 === '✊') ||
    (choice1 === '✌️' && choice2 === '✋')
  ) {
    return 'player1'
  }

  return 'player2'
}

const PORT = process.env.PORT || 5000
server.listen(PORT, () => {
  console.log(`🚀 Server เริ่มทำงานที่ http://localhost:${PORT}`)
  console.log(`📊 Leaderboard: http://localhost:${PORT}/api/leaderboard`)
  console.log(`🌍 WebSocket ต่อ: ws://localhost:${PORT}`)
})