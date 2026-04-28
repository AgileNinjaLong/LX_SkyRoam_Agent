import React, { useState } from 'react';
import { Card, Form, Input, Button, Typography, message } from 'antd';
import { buildApiUrl } from '../../config/api';
import { useNavigate } from 'react-router-dom';

const { Title, Paragraph } = Typography;

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: { username: string; email?: string; password: string; full_name?: string }) => {
    setLoading(true);
    try {
      const res = await fetch(buildApiUrl('/auth/register'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || '注册失败');
      }
      message.success('注册成功，请登录');
      navigate('/login');
    } catch (err: any) {
      message.error(err.message || '注册失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page" style={{ minHeight: 'calc(100vh - 64px - 70px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <Card className="glass-card" style={{ width: 560, borderRadius: 24 }} bodyStyle={{ padding: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{ width: 68, height: 68, borderRadius: '50%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(102,126,234,0.35)' }}>
            <img src="/images/logo.png" alt="Logo" style={{ width: 36, height: 36 }} />
          </div>
          <Title level={2} className="gradient-text" style={{ margin: 0, marginLeft: 14 }}>智枢 云台Agent</Title>
        </div>
        <Paragraph style={{ textAlign: 'center' }}>仅需用户名和密码，邮箱可选</Paragraph>
        <Form layout="vertical" onFinish={onFinish}>
          <Form.Item label="用户名" name="username" rules={[{ required: true, message: '请输入用户名' }]}> 
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item label="邮箱" name="email">
            <Input placeholder="可选，输入邮箱" />
          </Form.Item>
          <Form.Item label="昵称" name="full_name">
            <Input placeholder="可选，输入昵称" />
          </Form.Item>
          <Form.Item label="密码" name="password" rules={[{ required: true, message: '请输入密码' }]}> 
            <Input.Password placeholder="请输入密码" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block className="btn-primary">
              注册
            </Button>
          </Form.Item>
          <div style={{ textAlign: 'center' }}>
            <Button type="link" onClick={() => navigate('/login')}>已有账号？去登录</Button>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default RegisterPage;
