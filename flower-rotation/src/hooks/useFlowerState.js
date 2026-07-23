import { useState, useCallback } from 'react'
import { FLOWER_TYPES, COLOR_SCHEMES } from '../data/flowers'

const DEFAULT_SETTINGS = {
  rotationSpeed: 1,
  isPlaying: true,
  petalCount: 12,
  colorScheme: 'natural',
}

export function useFlowerState() {
  const [flowers] = useState(FLOWER_TYPES)
  const [selectedFlower, setSelectedFlower] = useState(FLOWER_TYPES[0])
  const [rotationSpeed, setRotationSpeed] = useState(DEFAULT_SETTINGS.rotationSpeed)
  const [isPlaying, setIsPlaying] = useState(DEFAULT_SETTINGS.isPlaying)
  const [petalCount, setPetalCount] = useState(DEFAULT_SETTINGS.petalCount)
  const [colorScheme, setColorScheme] = useState(DEFAULT_SETTINGS.colorScheme)
  const [error, setError] = useState(null)

  const resetSettings = useCallback(() => {
    setRotationSpeed(DEFAULT_SETTINGS.rotationSpeed)
    setIsPlaying(DEFAULT_SETTINGS.isPlaying)
    setPetalCount(DEFAULT_SETTINGS.petalCount)
    setColorScheme(DEFAULT_SETTINGS.colorScheme)
    setSelectedFlower(FLOWER_TYPES[0])
    setError(null)
  }, [])

  const handleSetPetalCount = useCallback((val) => {
    if (val < 3 || val > 40) {
      setError('花瓣数量需在 3-40 之间')
      return
    }
    setError(null)
    setPetalCount(val)
  }, [])

  return {
    flowers,
    selectedFlower,
    rotationSpeed,
    isPlaying,
    petalCount,
    colorScheme,
    error,
    setSelectedFlower,
    setRotationSpeed,
    setIsPlaying,
    setPetalCount: handleSetPetalCount,
    setColorScheme,
    resetSettings,
  }
}
