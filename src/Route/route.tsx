import 'react-router-dom'
import { Routes, Route } from 'react-router-dom'
import App from '../App'
import Play from '../Play'
import Leaderboard from '../Leaderboard'

function Rout() {
    return (
        <>
            <Routes>
                <Route path="/" element={<App />} />
                <Route path="/play" element={<Play/>} />
                <Route path="/Leaderboard" element={<Leaderboard/>} />
            </Routes>
        </>
    )
}
export default Rout