import logo from './logo.svg';
import './App.css';
import TheGame from './TheGame.js';

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <br/>
        <TheGame/>
      </header>
    </div>
  );
}

export default App;
