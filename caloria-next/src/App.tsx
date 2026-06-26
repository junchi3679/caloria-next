import { useGameStore } from './store/gameStore'
import TitleScreen from './components/screens/TitleScreen'
import CharacterSelect from './components/screens/CharacterSelect'
import GameScreen from './components/screens/GameScreen'
import GachaScreen from './components/screens/GachaScreen'
import SkinShop from './components/screens/SkinShop'
import './index.css'

export default function App() {
  const screen = useGameStore((s) => s.screen)

  return (
    <div style={{ width: '100vw', height: '100vh', overflow: 'hidden' }}>
      {screen === 'title' && <TitleScreen />}
      {screen === 'character_select' && <CharacterSelect />}
      {screen === 'game' && <GameScreen />}
      {screen === 'gacha' && <GachaScreen />}
      {screen === 'shop' && <SkinShop />}
    </div>
  )
}
