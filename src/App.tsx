import React from 'react'
import HaopingAnalysis from './components/HaopingAnalysis'
import './App.css'

function App() {
  return (
    <div className="App">
      <header className="App-header">
        <h1>安康蒿坪镇遥感影像分析平台</h1>
        <p>2013-2023年遥感数据监测与分析</p>
      </header>
      <main>
        <HaopingAnalysis />
      </main>
    </div>
  )
}

export default App