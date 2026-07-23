import { useState, useCallback } from 'react'
import { Typography, Row, Col, ErrorBoundary } from 'antd'
import FlowerCanvas from './components/FlowerCanvas'
import ControlPanel from './components/ControlPanel'
import FlowerGallery from './components/FlowerGallery'
import { useFlowerState } from './hooks/useFlowerState'
import './App.css'

const { Title } = Typography

export default function App() {
  const [galleryOpen, setGalleryOpen] = useState(false)
  const {
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
    setPetalCount,
    setColorScheme,
    resetSettings,
  } = useFlowerState()

  const toggleGallery = useCallback(() => setGalleryOpen((v) => !v), [])

  return (
    <div className="app">
      <div className="app-bg" />
      <header className="app-header">
        <Title level={2} className="app-title">
          🌸 鲜花旋转
        </Title>
        <p className="app-subtitle">交互式旋转花朵可视化</p>
      </header>

      <main className="app-main">
        <Row gutter={[24, 24]} justify="center" align="middle">
          <Col xs={24} lg={14}>
            <ErrorBoundary
              fallback={<div className="error-fallback">画布加载失败，请刷新页面重试</div>}
            >
              <FlowerCanvas
                flower={selectedFlower}
                speed={rotationSpeed}
                isPlaying={isPlaying}
                petalCount={petalCount}
                colorScheme={colorScheme}
                error={error}
              />
            </ErrorBoundary>
          </Col>

          <Col xs={24} lg={10}>
            <ControlPanel
              rotationSpeed={rotationSpeed}
              isPlaying={isPlaying}
              petalCount={petalCount}
              colorScheme={colorScheme}
              onSpeedChange={setRotationSpeed}
              onTogglePlay={() => setIsPlaying((v) => !v)}
              onPetalCountChange={setPetalCount}
              onColorChange={setColorScheme}
              onReset={resetSettings}
              onOpenGallery={toggleGallery}
            />
          </Col>
        </Row>
      </main>

      <FlowerGallery
        open={galleryOpen}
        onClose={() => setGalleryOpen(false)}
        flowers={flowers}
        selectedId={selectedFlower?.id}
        onSelect={(flower) => {
          setSelectedFlower(flower)
          setGalleryOpen(false)
        }}
      />
    </div>
  )
}
