'use client';

import { useState } from 'react';
import { adminApi } from '../../src/lib/api';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await adminApi.requestOtp(email, 'EMAIL');
      setStep('code');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await adminApi.login(email, code, 'EMAIL');
      adminApi.setToken(result.accessToken);
      // Store in localStorage for persistence
      localStorage.setItem('admin_token', result.accessToken);
      localStorage.setItem('admin_refresh_token', result.refreshToken);
      window.location.href = '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 w-full max-w-md">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Admin Login</h1>
        <p className="text-gray-500 mb-8">Sign in to the Proximity admin dashboard.</p>

        {error && (
          <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        {step === 'email' ? (
          <form onSubmit={handleRequestOtp}>
            <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              placeholder="admin@example.com"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Login Code'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleVerify}>
            <p className="text-sm text-gray-500 mb-4">Code sent to {email}</p>
            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="w-full border border-gray-300 rounded-lg px-4 py-3 mb-6 text-center text-2xl tracking-widest focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
              placeholder="000000"
              maxLength={6}
              required
            />
            <button
              type="submit"
              disabled={loading || code.length !== 6}
              className="w-full bg-primary text-white py-3 rounded-lg font-semibold hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {loading ? 'Verifying...' : 'Sign In'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
