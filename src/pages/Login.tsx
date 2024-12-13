import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { Eye, EyeOff, HelpCircle, Download, ArrowRight } from 'lucide-react';
import { styles } from '../utils/styleConstants';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore(state => state.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      await login(username, password);
      navigate('/');
    } catch (err) {
      console.error('Login failed:', err);
      setError('Неверное имя пользователя или пароль');
    }
  };

  return (
    <div className="grid lg:grid-cols-[1fr_400px] h-screen">
      {/* Left Side - Hero Section */}
      <div className="relative hidden lg:block bg-gradient-to-br from-primary/5 via-primary/10 to-transparent">
        <div className="absolute inset-0 bg-[url('/patterns/grid.svg')] opacity-30" />
        
        <div className="relative h-full flex flex-col items-center justify-center p-20">
          {/* Logo */}
          <img
            src={`${supabase.storage.from('logos').getPublicUrl('vertical orange.svg').data.publicUrl}`}
            alt="ApexFlow"
            className="h-32 mb-12"
          />

          {/* Hero Text */}
          <h1 className="text-4xl font-bold text-gray-900 text-center mb-6">
            Управляйте закупками <br/> с легкостью
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-lg">
            Автоматизируйте процессы, отслеживайте статусы и принимайте решения на основе данных в режиме реального времени
          </p>

          {/* Desktop App Promo */}
          <div className="absolute bottom-12 left-1/2 -translate-x-1/2">
            <button
              onClick={() => window.open('https://apexflow.app/download/windows', '_blank')}
              className="group flex items-center gap-4 p-4 bg-gray-50 border border-gray-200 rounded-xl text-gray-900
                       hover:bg-gray-100 active:scale-[0.98] transition-all"
            >
              <div className="flex-none p-2 bg-primary/10 rounded-lg">
                <Download className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <div className="text-sm font-medium text-gray-900">Скачать для Windows</div>
                <div className="text-xs text-gray-500">Версия 1.2.0</div>
              </div>
              <div className="flex-none">
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary transition-colors" />
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex flex-col justify-between p-8 bg-white">
        <div className="flex-1 flex flex-col items-center justify-center max-w-sm mx-auto w-full">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12">
            <img
              src={`${supabase.storage.from('logos').getPublicUrl('vertical orange.svg').data.publicUrl}`}
              alt="ApexFlow"
              className="h-24"
            />
          </div>

          {/* Form Header */}
          <div className="w-full text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Добро пожаловать
            </h2>
            <p className="text-sm text-gray-500">
              Войдите в систему, чтобы продолжить
            </p>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="w-full space-y-5">
            {error && (
              <div className="p-4 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 animate-shake">
                {error}
              </div>
            )}

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Имя пользователя
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={styles.input}
                placeholder="Введите имя пользователя"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Пароль
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className={styles.input}
                  placeholder="Введите пароль"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary text-white font-medium rounded-xl
                       hover:bg-primary/90 active:scale-[0.98] transition-all"
            >
              Войти
            </button>

            <div className="relative my-8">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">или</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => navigate('/register')}
              className="w-full h-12 bg-gray-50 text-gray-900 font-medium rounded-xl border border-gray-200
                       hover:bg-gray-100 active:scale-[0.98] transition-all"
            >
              Зарегистрироваться
            </button>
          </form>
        </div>

        {/* Support Link */}
        <div className="mt-8 text-center">
          <a
            href="https://t.me/apexflow_support"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary"
          >
            <HelpCircle className="w-4 h-4" />
            <span>Нужна помощь?</span>
          </a>
        </div>
      </div>
    </div>
  );
}