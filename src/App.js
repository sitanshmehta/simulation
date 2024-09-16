import './App.css';
import Canvas from './Components/Canvas/Canvas';
import FluidSimulation from './Components/FluidSimulator';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        {/* <Canvas /> */}
        <FluidSimulation />
      </header>
    </div>
  );
}

export default App;
