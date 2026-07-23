import { Card, Slider, Button, Switch, Select, Space, Tooltip, Divider, message } from 'antd'
import {
  PauseCircleOutlined,
  PlayCircleOutlined,
  ReloadOutlined,
  PictureOutlined,
} from '@ant-design/icons'
import { COLOR_SCHEMES } from '../data/flowers'
import './ControlPanel.css'

export default function ControlPanel({
  rotationSpeed,
  isPlaying,
  petalCount,
  colorScheme,
  onSpeedChange,
  onTogglePlay,
  onPetalCountChange,
  onColorChange,
  onReset,
  onOpenGallery,
}) {
  return (
    <Card className="control-panel" title="控制面板" bordered={false}>
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <div className="control-row">
          <label>旋转速度</label>
          <Slider
            min={0.1}
            max={5}
            step={0.1}
            value={rotationSpeed}
            onChange={onSpeedChange}
            tooltip={{ formatter: (v) => `${v}x` }}
            styles={{ track: { background: '#7c3aed' } }}
          />
          <span className="speed-label">{rotationSpeed.toFixed(1)}x</span>
        </div>

        <div className="control-row">
          <label>花瓣数量</label>
          <Slider
            min={3}
            max={40}
            step={1}
            value={petalCount}
            onChange={onPetalCountChange}
          />
          <span className="speed-label">{petalCount}</span>
        </div>

        <div className="control-row">
          <label>颜色主题</label>
          <Select
            value={colorScheme}
            onChange={onColorChange}
            style={{ width: '100%' }}
            options={COLOR_SCHEMES.map((s) => ({ label: s.name, value: s.id }))}
          />
        </div>

        <Divider style={{ margin: '4px 0', borderColor: 'rgba(255,255,255,0.08)' }} />

        <div className="control-row control-actions">
          <Tooltip title={isPlaying ? '暂停' : '播放'}>
            <Button
              type="primary"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={onTogglePlay}
              size="large"
              block
            >
              {isPlaying ? '暂停' : '播放'}
            </Button>
          </Tooltip>
        </div>

        <div className="control-row control-actions">
          <Space style={{ width: '100%' }}>
            <Button icon={<PictureOutlined />} onClick={onOpenGallery} style={{ flex: 1 }}>
              花卉图鉴
            </Button>
            <Button icon={<ReloadOutlined />} onClick={onReset} style={{ flex: 1 }}>
              重置设置
            </Button>
          </Space>
        </div>
      </Space>
    </Card>
  )
}
