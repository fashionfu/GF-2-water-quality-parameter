import React from 'react'
import GeoScenePreciseLayer from './GeoScenePreciseLayer'
import './HaopingAnalysis.css'

const HaopingAnalysis: React.FC = () => {
  return (
    <div className="haoping-analysis">
      <div className="map-wrapper">
        <GeoScenePreciseLayer />
      </div>
    </div>
  )
}

export default HaopingAnalysis