import React, { useState, useEffect } from 'react';
import { Drawer, Typography, Button, Progress, Timeline, Badge, Space } from 'antd';
import {
  RocketOutlined,
  CheckCircleOutlined,
  SyncOutlined,
  ThunderboltOutlined,
  StarOutlined,
  CloseOutlined
} from '@ant-design/icons';
import './SystemUpgradeNotice.css';
import UpgradeManager, { UpgradeConfig, UpgradeFeature } from '../../utils/upgradeManager';
const { Title, Paragraph, Text } = Typography;

interface SystemUpgradeNoticeProps {
  visible: boolean;
  onClose: () => void;
  config?: UpgradeConfig;
}

const SystemUpgradeNotice: React.FC<SystemUpgradeNoticeProps> = ({ visible, onClose, config }) => {
  const [internalProgress, setInternalProgress] = useState(0);
  
  // 使用传入的配置或默认配置
  const upgradeConfig = config || UpgradeManager.getCurrentConfig();
  const upgradeFeatures = upgradeConfig.features;
  const progress = upgradeConfig.showProgress ? (upgradeConfig.progress !== undefined ? upgradeConfig.progress : internalProgress) : 100;

  useEffect(() => {
    if (visible && upgradeConfig.showProgress && upgradeConfig.progress === undefined) {
      const timer = setInterval(() => {
        setInternalProgress((prev: number) => {
          if (prev >= 75) return 75;
          return prev + 1;
        });
      }, 50);
      
      return () => clearInterval(timer);
    }
  }, [visible, upgradeConfig]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircleOutlined style={{ color: '#34d399', filter: 'drop-shadow(0 0 8px rgba(52, 211, 153, 0.5))' }} />;
      case 'in-progress':
        return <SyncOutlined spin style={{ color: '#60a5fa', filter: 'drop-shadow(0 0 8px rgba(96, 165, 250, 0.5))' }} />;
      case 'upcoming':
        return <ThunderboltOutlined style={{ color: '#fbbf24', filter: 'drop-shadow(0 0 8px rgba(251, 191, 36, 0.5))' }} />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'in-progress':
        return 'processing';
      case 'upcoming':
        return 'warning';
      default:
        return 'default';
    }
  };

  return (
    <Drawer
      title={
        <div className="upgrade-notice-header">
          <RocketOutlined className="upgrade-icon" />
          <span className="gradient-text">系统升级通知</span>
        </div>
      }
      placement="right"
      width={480}
      open={visible}
      onClose={onClose}
      closable={false}
      extra={
        <Button
          type="text"
          icon={<CloseOutlined />}
          onClick={onClose}
          className="close-button"
        />
      }
      className="system-upgrade-drawer"
    >
      <div className="upgrade-notice-content">
        <div className="upgrade-intro">
          <Badge.Ribbon text="v2.0 升级中" color="blue">
            <div className="upgrade-version-card">
              <Title level={4}>
                <StarOutlined /> 智枢云台Agent 全新升级
              </Title>
              <Paragraph>
                为了给您提供更好的服务体验，我们正在进行系统升级。本次升级将带来更智能的AI推荐、更流畅的用户体验和更丰富的功能特性。
              </Paragraph>
            </div>
          </Badge.Ribbon>
        </div>

        <div className="upgrade-progress-section">
          <Title level={5}>升级进度</Title>
          <Progress 
            percent={progress} 
            status="active"
            strokeColor={{
              '0%': '#6366f1',
              '100%': '#8b5cf6',
            }}
            format={() => `${progress}%`}
          />
          <Text type="secondary" style={{ fontSize: '12px', marginTop: '8px', display: 'block' }}>
            预计还需要 30-60 分钟完成升级
          </Text>
        </div>

        <div className="upgrade-features-section">
          <Title level={5}>升级内容</Title>
          <Timeline
            mode="left"
            items={upgradeFeatures.map((feature: UpgradeFeature, index: number) => ({
              dot: getStatusIcon(feature.status),
              color: getStatusColor(feature.status) === 'success' ? '#52c41a' : 
                     getStatusColor(feature.status) === 'processing' ? '#1890ff' : '#faad14',
              children: (
                <div className="feature-item">
                  <div className="feature-header">
                    <Text strong>{feature.title}</Text>
                    <Badge 
                      status={getStatusColor(feature.status) as any}
                      text={
                        feature.status === 'completed' ? '已完成' :
                        feature.status === 'in-progress' ? '升级中' : '即将推出'
                      }
                    />
                  </div>
                  <Paragraph type="secondary" style={{ margin: '4px 0 0 0', fontSize: '12px' }}>
                    {feature.description}
                  </Paragraph>
                </div>
              )
            }))}
          />
        </div>

        <div className="upgrade-notice-section">
          <div className="notice-card">
            <Title level={5}>
              <ThunderboltOutlined style={{ color: '#faad14' }} /> 升级期间说明
            </Title>
            <ul className="notice-list">
              <li>系统功能正常运行，您可以继续使用所有核心功能</li>
              <li>部分新功能可能陆续上线，请关注系统通知</li>
              <li>升级过程中如有问题，请联系客服支持</li>
              <li>建议收藏本页，随时查看升级进度</li>
            </ul>
          </div>
        </div>

        <div className="upgrade-actions">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Button 
              type="primary" 
              block 
              icon={<CheckCircleOutlined />}
              onClick={onClose}
            >
              知道了，开始使用
            </Button>
            <Button 
              type="link" 
              block
              onClick={() => window.open('https://github.com/Ikaros-521/LX_SkyRoam_Agent', '_blank')}
            >
              查看更新日志
            </Button>
          </Space>
        </div>

        <div className="upgrade-footer">
          <Text type="secondary" style={{ fontSize: '12px', textAlign: 'center', display: 'block' }}>
            升级时间：2025年12月12日 | 预计完成：2025年12月12日 18:00
          </Text>
        </div>
      </div>
    </Drawer>
  );
};

export default SystemUpgradeNotice;
