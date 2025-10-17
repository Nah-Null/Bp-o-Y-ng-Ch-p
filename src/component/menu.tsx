import '../css/menu.css'

const Menu = ({play} :{play:string}) => {
  return (
    <div className="play-container">
      <h2 className="title">เลือกของคุณ!</h2>
      <div className="button-group">
        <button className="rps-btn rock" onClick={() => play('rock')}>✊</button>
        <button className="rps-btn paper" onClick={() => play('paper')}>✋</button>
        <button className="rps-btn scissors" onClick={() => play('scissors')}>✌️</button>
      </div>
    </div>
  )
}

export default Menu
