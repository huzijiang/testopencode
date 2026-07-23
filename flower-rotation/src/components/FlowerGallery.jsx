import { Drawer, Row, Col, Card, Typography, Badge } from 'antd'
import './FlowerGallery.css'

const { Text } = Typography

export default function FlowerGallery({ open, onClose, flowers, selectedId, onSelect }) {
  return (
    <Drawer
      title="花卉图鉴"
      placement="right"
      onClose={onClose}
      open={open}
      width={380}
      className="flower-gallery"
    >
      <Row gutter={[12, 12]}>
        {flowers.map((flower) => (
          <Col span={12} key={flower.id}>
            <Badge dot={flower.id === selectedId} color="#7c3aed">
              <Card
                hoverable
                className={`gallery-card ${flower.id === selectedId ? 'selected' : ''}`}
                onClick={() => onSelect(flower)}
                cover={
                  <div
                    className="gallery-cover"
                    style={{ background: `linear-gradient(135deg, ${flower.colors[0]}, ${flower.colors[1] || flower.colors[0]})` }}
                  >
                    <FlowerIcon colors={flower.colors} petals={flower.petals} />
                  </div>
                }
              >
                <Text className="gallery-name">{flower.name}</Text>
                <Text className="gallery-meta">{flower.petals} 瓣</Text>
              </Card>
            </Badge>
          </Col>
        ))}
      </Row>
    </Drawer>
  )
}

function FlowerIcon({ colors, petals }) {
  const displayPetals = Math.min(petals, 12)
  return (
    <svg viewBox="0 0 100 100" width="64" height="64">
      {Array.from({ length: displayPetals }).map((_, i) => {
        const angle = (i / displayPetals) * Math.PI * 2
        const x = 50 + Math.cos(angle) * 28
        const y = 50 + Math.sin(angle) * 28
        return (
          <ellipse
            key={i}
            cx={x}
            cy={y}
            rx="10"
            ry="16"
            fill={colors[i % colors.length]}
            opacity="0.9"
            transform={`rotate(${(angle * 180) / Math.PI} ${x} ${y})`}
          />
        )
      })}
      <circle cx="50" cy="50" r="8" fill="#ffd166" />
    </svg>
  )
}
