import { useEffect, useState } from 'react'

interface LeaderboardEntry {
  rank: number
  country: string
  countryCode: string
  wins: number
  losses: number
  draws: number
  totalGames: number
  winRate: number
  flag: string
}

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [filterCountry, setFilterCountry] = useState('')
  const [sortBy, setSortBy] = useState<'wins' | 'winRate' | 'totalGames'>('wins')

  // ดึงข้อมูล Leaderboard จาก Server
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const SERVER_URL = process.env.REACT_APP_SERVER_URL || 'https://rock-paper-scissors-server.vercel.app/'
        const response = await fetch(`${SERVER_URL}/api/leaderboard`)
        const data = await response.json()

        // จัดรูปข้อมูล
        const formatted = data.map((item: any, index: number) => ({
          rank: index + 1,
          country: item.country,
          countryCode: item.countryCode,
          wins: item.wins,
          losses: item.losses,
          draws: item.draws,
          totalGames: item.wins + item.losses + item.draws,
          winRate: item.wins + item.losses + item.draws > 0 
            ? ((item.wins / (item.wins + item.losses + item.draws)) * 100).toFixed(1)
            : 0,
          flag: getFlagEmoji(item.countryCode)
        }))

        setLeaderboard(formatted)
        setLoading(false)
      } catch (error) {
        console.error('Error fetching leaderboard:', error)
        setLoading(false)
      }
    }

    fetchLeaderboard()
    const interval = setInterval(fetchLeaderboard, 5000) // อัปเดตทุก 5 วินาที

    return () => clearInterval(interval)
  }, [])

  // ฟังก์ชันแปลง Country Code เป็น Flag Emoji
  const getFlagEmoji = (countryCode: string): string => {
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map((char) => 127397 + char.charCodeAt(0))
    return String.fromCodePoint(...codePoints)
  }

  // กรองและเรียงลำดับข้อมูล
  const filteredAndSorted = leaderboard
    .filter((entry) => {
      if (!filterCountry) return true
      return entry.country.toLowerCase().includes(filterCountry.toLowerCase()) ||
             entry.countryCode.toLowerCase().includes(filterCountry.toLowerCase())
    })
    .sort((a, b) => {
      if (sortBy === 'wins') return b.wins - a.wins
      if (sortBy === 'winRate') return parseFloat(b.winRate as any) - parseFloat(a.winRate as any)
      if (sortBy === 'totalGames') return b.totalGames - a.totalGames
      return 0
    })

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.title}>🏆 ลีดเดอร์บอร์ดโลก</h1>
        <p style={styles.subtitle}>อันดับสูงสุดผู้เล่นจากทั่วโลก</p>
      </div>

      {/* Controls */}
      <div style={styles.controls}>
        <input
          type="text"
          placeholder="ค้นหาประเทศ..."
          value={filterCountry}
          onChange={(e) => setFilterCountry(e.target.value)}
          style={styles.searchInput}
        />

        <div style={styles.sortButtons}>
          <button
            onClick={() => setSortBy('wins')}
            style={{
              ...styles.sortBtn,
              ...(sortBy === 'wins' ? styles.sortBtnActive : {})
            }}
          >
            🎯 ชัยชนะ
          </button>
          <button
            onClick={() => setSortBy('winRate')}
            style={{
              ...styles.sortBtn,
              ...(sortBy === 'winRate' ? styles.sortBtnActive : {})
            }}
          >
            📊 อัตรา
          </button>
          <button
            onClick={() => setSortBy('totalGames')}
            style={{
              ...styles.sortBtn,
              ...(sortBy === 'totalGames' ? styles.sortBtnActive : {})
            }}
          >
            🎮 ทั้งหมด
          </button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div style={styles.loadingContainer}>
          <div style={styles.spinner}></div>
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      )}

      {/* Leaderboard Table */}
      {!loading && (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.headerRow}>
                <th style={{ ...styles.th, width: '60px' }}>อันดับ</th>
                <th style={{ ...styles.th, width: '120px' }}>ประเทศ</th>
                <th style={{ ...styles.th, width: '80px' }}>ชัยชนะ</th>
                <th style={{ ...styles.th, width: '80px' }}>พ่าย</th>
                <th style={{ ...styles.th, width: '80px' }}>เสมอ</th>
                <th style={{ ...styles.th, width: '80px' }}>ทั้งหมด</th>
                <th style={{ ...styles.th, width: '80px' }}>อัตรา (%)</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSorted.length > 0 ? (
                filteredAndSorted.map((entry, idx) => (
                  <tr
                    key={`${entry.countryCode}-${idx}`}
                    style={{
                      ...styles.row,
                      ...(entry.rank <= 3 ? styles.topRow : {})
                    }}
                  >
                    <td style={styles.td}>
                      {entry.rank === 1 && '🥇'}
                      {entry.rank === 2 && '🥈'}
                      {entry.rank === 3 && '🥉'}
                      {entry.rank > 3 && <span style={styles.rankNumber}>{entry.rank}</span>}
                    </td>
                    <td style={styles.td}>
                      <span style={styles.flagEmoji}>{entry.flag}</span>
                      <span>{entry.country}</span>
                    </td>
                    <td style={{ ...styles.td, color: '#4ade80' }}>
                      <strong>{entry.wins}</strong>
                    </td>
                    <td style={{ ...styles.td, color: '#f87171' }}>
                      <strong>{entry.losses}</strong>
                    </td>
                    <td style={{ ...styles.td, color: '#facc15' }}>
                      <strong>{entry.draws}</strong>
                    </td>
                    <td style={styles.td}>
                      <strong>{entry.totalGames}</strong>
                    </td>
                    <td style={styles.td}>
                      <strong>{entry.winRate}%</strong>
                    </td>
                  </tr>
                ))
              ) : (
                <tr style={styles.emptyRow}>
                  <td colSpan={7} style={styles.td}>
                    ไม่พบข้อมูล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Summary */}
      <div style={styles.statsGrid}>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>{leaderboard.length}</span>
          <span style={styles.statLabel}>ประเทศทั้งหมด</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {leaderboard.reduce((sum, entry) => sum + entry.totalGames, 0)}
          </span>
          <span style={styles.statLabel}>เกมทั้งหมด</span>
        </div>
        <div style={styles.statItem}>
          <span style={styles.statNumber}>
            {leaderboard.length > 0 ? leaderboard[0].country : '-'}
          </span>
          <span style={styles.statLabel}>อันดับที่ 1</span>
        </div>
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#000',
    color: '#fff',
    padding: '40px 20px',
    fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
  },
  header: {
    textAlign: 'center',
    marginBottom: '40px',
  },
  title: {
    fontSize: '40px',
    margin: '0 0 10px 0',
    background: 'linear-gradient(135deg, #06b6d4, #0ea5e9)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255, 255, 255, 0.6)',
    margin: '0',
  },
  controls: {
    display: 'flex',
    gap: '15px',
    marginBottom: '30px',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    padding: '12px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: '#fff',
    fontSize: '14px',
    minWidth: '200px',
    outline: 'none',
  },
  sortButtons: {
    display: 'flex',
    gap: '10px',
  },
  sortBtn: {
    padding: '10px 16px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: '13px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  sortBtnActive: {
    backgroundColor: 'rgba(6, 182, 212, 0.3)',
    color: '#06b6d4',
    borderBottom: '2px solid #06b6d4',
  },
  loadingContainer: {
    textAlign: 'center',
    padding: '60px 20px',
  },
  spinner: {
    display: 'inline-block',
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255, 255, 255, 0.2)',
    borderTopColor: '#06b6d4',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  tableContainer: {
    overflowX: 'auto',
    borderRadius: '12px',
    marginBottom: '40px',
    background: 'rgba(255, 255, 255, 0.05)',
    backdropFilter: 'blur(10px)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    fontSize: '14px',
  },
  headerRow: {
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderBottom: '2px solid rgba(6, 182, 212, 0.3)',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontWeight: '600',
    color: '#06b6d4',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.5px',
  },
  row: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.05)',
    transition: 'all 0.2s ease',
  },
  topRow: {
    backgroundColor: 'rgba(6, 182, 212, 0.05)',
  },
  td: {
    padding: '14px 16px',
    display: 'table-cell',
  },
  rankNumber: {
    display: 'inline-block',
    minWidth: '24px',
    textAlign: 'center',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.7)',
  },
  flagEmoji: {
    marginRight: '10px',
    fontSize: '20px',
  },
  emptyRow: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.5)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
  },
  statItem: {
    padding: '20px',
    borderRadius: '12px',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    textAlign: 'center',
    backdropFilter: 'blur(10px)',
  },
  statNumber: {
    display: 'block',
    fontSize: '32px',
    fontWeight: 'bold',
    color: '#06b6d4',
    marginBottom: '8px',
  },
  statLabel: {
    display: 'block',
    fontSize: '13px',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
}

export default Leaderboard