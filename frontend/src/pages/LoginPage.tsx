import { useState } from 'react';
import { Shield, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { login as loginService } from '../services';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const { data } = await loginService(email, password);
      login(data.token, data.user);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const quickLogin = (role: 'admin' | 'commander' | 'logistics') => {
    const creds = {
      admin: { email: 'admin@military.gov', password: 'admin123' },
      commander: { email: 'commander.alpha@military.gov', password: 'commander123' },
      logistics: { email: 'logistics1@military.gov', password: 'officer123' },
    };
    setEmail(creds[role].email);
    setPassword(creds[role].password);
  };

  return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4"
      style={{
        backgroundImage: `
          radial-gradient(ellipse at 30% 40%, rgba(46, 87, 44, 0.12) 0%, transparent 60%),
          radial-gradient(ellipse at 70% 60%, rgba(26, 50, 26, 0.08) 0%, transparent 50%)
        `
      }}
    >
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-military-800 border border-military-700 rounded-2xl mb-4 glow-green">
            <Shield className="w-8 h-8 text-military-300" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">MAMS</h1>
          <p className="text-gray-400 text-sm">Military Asset Management System</p>
          <p className="text-gray-600 text-xs mt-1">CLASSIFIED ACCESS — AUTHORIZED PERSONNEL ONLY</p>
        </div>

        {/* Login Card */}
        <div className="card border-gray-700">
          <h2 className="text-base font-semibold text-white mb-5">Secure Sign In</h2>

          {error && (
            <div className="flex items-center gap-2 bg-red-950 border border-red-800 text-red-300 px-4 py-3 rounded-lg mb-4 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="label">Email / Badge ID</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input"
                placeholder="user@military.gov"
                required
                autoComplete="email"
              />
            </div>

            <div>
              <label className="label">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-military-700 hover:bg-military-600 disabled:opacity-50 disabled:cursor-not-allowed
                         text-white font-semibold py-2.5 rounded-lg transition-all duration-200 text-sm
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Authenticating...
                </>
              ) : 'Sign In'}
            </button>
          </form>

          {/* Quick Login - Demo */}
          <div className="mt-6 pt-5 border-t border-gray-800">
            <p className="text-xs text-gray-500 mb-3 text-center uppercase tracking-wide">Demo Quick Login</p>
            <div className="grid grid-cols-3 gap-2">
              {[
                { role: 'admin' as const, label: 'Admin', color: 'border-red-800 text-red-400 hover:bg-red-950' },
                { role: 'commander' as const, label: 'Commander', color: 'border-military-700 text-military-400 hover:bg-military-950' },
                { role: 'logistics' as const, label: 'Logistics', color: 'border-olive-700 text-olive-400 hover:bg-olive-950' },
              ].map(({ role, label, color }) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => quickLogin(role)}
                  className={`text-xs py-2 px-2 rounded-lg border bg-gray-900 transition-all ${color}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-700 mt-4">
          All access is monitored and logged for security audit purposes.
        </p>
      </div>
    </div>
  );
}
