'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { Button, Input } from '@/components/ui';
import { BookOpen, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setUser, setToken } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await api.login(email, password);
      setToken(data.access_token);
      
      // Get user profile
      const user = await api.getProfile();
      setUser(user);
      
      router.push('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Failed to login. Please check your credentials.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <Link href="/" className="flex items-center gap-2 mb-8">
            <BookOpen className="w-8 h-8 text-accent" />
            <span className="text-2xl font-bold text-gradient">NarrativeFlow</span>
          </Link>

          <h1 className="text-3xl font-bold font-display text-text-primary mb-2">
            Welcome back
          </h1>
          <p className="text-text-secondary mb-8">
            Sign in to continue your creative journey
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-3 bg-danger/10 border border-danger/30 rounded-lg text-danger text-sm">
                {error}
              </div>
            )}

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

            <div className="flex justify-end">
              <Link
                href="/auth/forgot-password"
                className="text-sm text-accent hover:text-accent-hover transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            <Button type="submit" className="w-full" isLoading={loading}>
              Sign In
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>

            <p className="text-center text-sm text-text-secondary">
              Don't have an account?{' '}
              <Link
                href="/auth/register"
                className="text-accent hover:text-accent-hover transition-colors"
              >
                Create one
              </Link>
            </p>
          </form>
        </motion.div>
      </div>

      {/* Right Side - Decoration */}
      <div className="hidden lg:flex flex-1 bg-gradient-to-br from-accent/20 via-background-secondary to-background items-center justify-center p-8">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-lg text-center"
        >
          <div className="text-6xl mb-6">📖</div>
          <h2 className="text-2xl font-bold font-display text-text-primary mb-4">
            Your Stories Await
          </h2>
          <p className="text-text-secondary leading-relaxed">
            Continue crafting your narratives with the power of AI. Your characters,
            worlds, and stories are all here waiting for you.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
