import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, User, LogIn, Loader2 } from 'lucide-react';
import { login } from './api';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await login(username, password);
      localStorage.setItem('sudacards_token', res.token);
      localStorage.setItem('sudacards_user', JSON.stringify(res.user));
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'اسم المستخدم أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 relative overflow-hidden">
      {/* Background glowing effects */}
      <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-primary rounded-full blur-[120px] opacity-20 pointer-events-none"></div>
      <div className="absolute bottom-[-10%] left-[-5%] w-[300px] h-[300px] bg-teal-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>

      <div className="glass rounded-2xl w-full max-w-md p-8 relative z-10 shadow-2xl border border-white/10">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">لوحة التحكم</h1>
          <p className="text-gray-400">نظام إدارة سوداكارد (SudaCards)</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">اسم المستخدم</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full bg-surface/50 border border-gray-600 text-white rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="أدخل اسم المستخدم"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">كلمة المرور</label>
            <div className="relative">
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-surface/50 border border-gray-600 text-white rounded-xl py-3 pr-10 pl-4 focus:ring-2 focus:ring-primary focus:border-transparent transition-all outline-none"
                placeholder="أدخل كلمة المرور"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-blue-600 disabled:opacity-60 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <LogIn className="w-5 h-5" />}
            <span>{loading ? 'جاري الدخول...' : 'تسجيل الدخول'}</span>
          </button>
        </form>
        
        <div className="mt-6 text-center text-xs text-gray-500">
          هذا النظام محمي. جميع محاولات الدخول مسجلة.
        </div>
      </div>
    </div>
  );
};

export default Login;
