import React from 'react';
import { Button, Row, Col, Typography, Space } from 'antd';
import {
  RocketOutlined,
  ArrowRightOutlined,
  ThunderboltOutlined,
  ZoomInOutlined,
  StarOutlined,
  GithubOutlined
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import './HomePage.css';

const { Title, Paragraph } = Typography;

const featureList = [
  {
    icon: '✨',
    title: 'AI 智能规划',
    description: '基于深度学习的推荐系统，为您生成最优旅行路线'
  },
  {
    icon: '🗺️',
    title: '全球覆盖',
    description: '覆盖 280+ 城市，随时随地规划你的目的地'
  },
  {
    icon: '⚡',
    title: '极速生成',
    description: '先进引擎秒级响应，瞬间获取完整方案'
  },
  {
    icon: '💰',
    title: '智能省钱',
    description: '动态价格分析，平均为你节省 20-40% 预算'
  }
];

const statCards = [
  { label: '活跃用户', value: '12.3K+', gradient: 'linear-gradient(135deg, #8b5cf6 0%, #ec4899 100%)' },
  { label: '规划方案', value: '45.6K+', gradient: 'linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)' },
  { label: '覆盖城市', value: '280+', gradient: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)' },
  { label: '满意度', value: '98.7%', gradient: 'linear-gradient(135deg, #fb923c 0%, #ef4444 100%)' }
];

const workflowSteps = [
  {
    number: '1',
    title: '说出你的梦想',
    description: '输入目的地、预算、天数与旅行风格',
    emoji: '🎯'
  },
  {
    number: '2',
    title: 'AI 智能规划',
    description: '自动生成吃住行娱一体化方案',
    emoji: '🤖'
  },
  {
    number: '3',
    title: '一键调整分享',
    description: '可视化编辑，导出并分享给出行伙伴',
    emoji: '🚀'
  }
];

const heroHighlights = [
  { label: '活跃用户', value: '12.3K+' },
  { label: '生成方案', value: '45.6K+' },
  { label: '满意度', value: '98.7%' }
];

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      <section className="hero-section">
        <div className="hero-bg-gradient" />
        <div className="hero-glow hero-glow-1" />
        <div className="hero-glow hero-glow-2" />
        <div className="hero-glow hero-glow-3" />

        <div className="hero-content">
          <div className="hero-badge">
            <StarOutlined />
            <span>由 AI 驱动的旅行规划</span>
          </div>

          <Title level={1} className="hero-title">
            <span className="gradient-text">智枢 云台Agent</span>
          </Title>
          <Title level={2} className="hero-subtitle">
            你的 AI 智能旅行规划师
          </Title>
          <Paragraph className="hero-description">
            基于先进的人工智能技术，为全球旅行者提供个性化、省时省钱的旅行规划方案。让每一次出行都成为难忘的冒险。
          </Paragraph>

          <Space className="hero-buttons" wrap>
            <Button
              size="large"
              className="btn-primary"
              icon={<ArrowRightOutlined />}
              onClick={() => navigate('/plan')}
            >
              开始规划
            </Button>
            <Button
              size="large"
              className="btn-secondary"
              icon={<ZoomInOutlined />}
              onClick={() => navigate('/plans?tab=public')}
            >
              查看演示
            </Button>
            <Button
              size="large"
              className="btn-secondary"
              icon={<GithubOutlined />}
              onClick={() => window.open('https://github.com/Ikaros-521/LX_SkyRoam_Agent', '_blank')}
            >
              获取源码
            </Button>
          </Space>

          <div className="hero-stats">
            {heroHighlights.map((stat) => (
              <div className="stat-item" key={stat.label}>
                <span className="stat-number">{stat.value}</span>
                <span className="stat-label">{stat.label}</span>
              </div>
            ))}
          </div>
        </div>

        <svg className="hero-wave" viewBox="0 0 1440 120" preserveAspectRatio="none">
          <path fill="#0f0f1e" d="M0,40 C240,120 480,0 720,60 C960,120 1200,40 1440,100 L1440,120 L0,120 Z" />
        </svg>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <Title level={2}>为什么选择智枢云台</Title>
            <Paragraph>业界领先的 AI 技术，为您打造完美旅行体验</Paragraph>
          </div>

          <Row gutter={[24, 24]}>
            {featureList.map((feature) => (
              <Col xs={24} sm={12} md={6} key={feature.title}>
                <div className="feature-card glass-card">
                  <div className="feature-icon">{feature.icon}</div>
                  <Title level={4}>{feature.title}</Title>
                  <Paragraph>{feature.description}</Paragraph>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="stats-section">
        <div className="container">
          <Title level={2} className="stats-title">
            数据说话
          </Title>
          <Row gutter={[32, 32]}>
            {statCards.map((stat) => (
              <Col xs={12} sm={6} key={stat.label}>
                <div className="stat-card" style={{ backgroundImage: stat.gradient }}>
                  <div className="stat-card-content">
                    <div className="stat-card-value">{stat.value}</div>
                    <div className="stat-card-label">{stat.label}</div>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="how-section">
        <div className="container">
          <div className="section-header">
            <Title level={2}>如何使用</Title>
            <Paragraph>简单三步，开启你的梦幻之旅</Paragraph>
          </div>

          <Row gutter={[32, 32]}>
            {workflowSteps.map((step, index) => (
              <Col xs={24} md={8} key={step.number}>
                <div className="step-card">
                  <div className="step-header">
                    <div className="step-number">{step.number}</div>
                    <div className="step-emoji">{step.emoji}</div>
                  </div>
                  <Title level={4}>{step.title}</Title>
                  <Paragraph>{step.description}</Paragraph>
                  {index < workflowSteps.length - 1 && <div className="step-arrow">→</div>}
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </section>

      <section className="cta-section">
        <div className="container">
          <div className="cta-card glass-card">
            <ThunderboltOutlined className="cta-icon" />
            <Title level={2}>准备好开启梦幻之旅了吗？</Title>
            <Paragraph>加入数万旅行者，用 AI 规划属于你的完美行程</Paragraph>
            <Button
              size="large"
              className="btn-primary btn-large"
              icon={<RocketOutlined />}
              onClick={() => navigate('/plan')}
            >
              立即开始
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default HomePage;
