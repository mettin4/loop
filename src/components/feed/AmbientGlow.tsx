import { useEffect, useRef, useState } from 'react'
import './AmbientGlow.css'

type Layer = { color: string; active: boolean }

interface Props {
  color: string
}

function AmbientGlow({ color }: Props) {
  const [layerA, setLayerA] = useState<Layer>({ color, active: true })
  const [layerB, setLayerB] = useState<Layer>({ color, active: false })
  const showingARef = useRef(true)
  const lastColorRef = useRef(color)

  useEffect(() => {
    if (color === lastColorRef.current) return
    lastColorRef.current = color

    if (showingARef.current) {
      setLayerB({ color, active: true })
      setLayerA((s) => ({ ...s, active: false }))
      showingARef.current = false
    } else {
      setLayerA({ color, active: true })
      setLayerB((s) => ({ ...s, active: false }))
      showingARef.current = true
    }
  }, [color])

  return (
    <div className="ambient-glow" aria-hidden="true">
      <div
        className={`ambient-glow-layer${
          layerA.active ? ' ambient-glow-active' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse 60% 80% at 15% 50%, ${layerA.color} 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 85% 50%, ${layerA.color} 0%, transparent 70%)`,
        }}
      />
      <div
        className={`ambient-glow-layer${
          layerB.active ? ' ambient-glow-active' : ''
        }`}
        style={{
          background: `radial-gradient(ellipse 60% 80% at 15% 50%, ${layerB.color} 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 85% 50%, ${layerB.color} 0%, transparent 70%)`,
        }}
      />
      <div className="ambient-glow-noise" />
    </div>
  )
}

export default AmbientGlow
