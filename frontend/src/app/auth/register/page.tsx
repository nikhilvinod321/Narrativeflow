'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button, Input } from '@/components/ui';
import { BookOpen, ArrowRight, Check } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'Contains a number', met: /\d/.test(password) },
    { label: 'Contains uppercase', met: /[A-Z]/.test(password) },
    { label: 'Passwords match', met: password === confirmPassword && password.length > 0 },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      // Register - the backend returns a token directly
      const registerData = await api.register(email, username, password);
      
      // Set token from registration response
      setToken(registerData.access_token);
      
      // Set user from registration response
      if (registerData.user) {
        setUser(registerData.user);
      } else {
        // Fallback: get user profile
        const user = await api.getProfile();
        setUser(user);
      }
      
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to create account. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-bl from-accent/20 via-background-secondary to-background items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-2xl font-bold font-display text-text-primary mb-4">
            Begin Your Story
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Join thousands of writers creating compelling narratives with AI assistance.
            Your imagination is the only limit.
          </p>
        </motion.div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="flex items-center gap-2 mb-8">
            <BookOpen className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-gradient">NarrativeFlow</span>
          </Link>

          <h1 className="text-3xl font-bold font-display text-text-primary mb-2">
            Create Account
          </h1>
          <p className="text-text-secondary mb-8">
            Start your creative journey with AI-powered storytelling
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

            <Input
              label="Username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="creativemind"
              required
            />

            <Input
              label="Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            <Input
              label="Confirm Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="••••••••"
              required
            />

            {/* Password Requirements */}
            <div className="space-y-2">
              {passwordRequirements.map((req, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-2 text-xs ${
                    req.met ? 'text-success' : 'text-text-tertiary'
                  }`}
                >
                  <div
                    className={`w-4 h-4 rounded-full flex items-center justify-center ${
                      req.met ? 'bg-success' : 'bg-surface border border-surface-border'
                    }`}
                  >
                    {req.met && <Check className="w-3 h-3 text-white" />}
                  </div>
                  {req.label}
                </div>
              ))}
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Create Account
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-xs text-text-tertiary">
              By creating an account, you agree to our{' '}
              <Link href="/terms" className="text-accent hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link href="/privacy" className="text-accent hover:underline">
                Privacy Policy
              </Link>
            </p>

            <p className="text-center text-sm text-text-secondary">
              Already have an account?{' '}
              <Link
                href="/auth/login"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Sign in
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
