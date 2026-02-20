'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api, type AiTokenSettingsResponse, type ApiProvidersResponse, type ApiProviderStatus } from '@/lib/api';
import { Sidebar } from '@/components/layout/Sidebar';
import { Button } from '@/components/ui';
import { User, Mail, Lock, LogOut, Save, Eye, EyeOff, Key, CheckCircle, Trash2, RefreshCw, Zap } from 'lucide-react';

export default function SettingsPage() {
  const router = useRouter();
  const { user, isAuthenticated, logout, setUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [fullName, setFullName] = useState('');

  // Password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [aiSettings, setAiSettings] = useState<AiTokenSettingsResponse | null>(null);
  const [aiForm, setAiForm] = useState<Record<string, string>>({});
  const [aiLoading, setAiLoading] = useState(false);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  const [currentModel, setCurrentModel] = useState('');
  const [modelLoading, setModelLoading] = useState(false);

  // External API key state
  const [apiProviders, setApiProviders] = useState<ApiProvidersResponse | null>(null);
  const [extApiKey, setExtApiKey] = useState('');
  const [extShowKey, setExtShowKey] = useState(false);
  const [extSaving, setExtSaving] = useState(false);
  const [extDeleting, setExtDeleting] = useState(false);
  const [activating, setActivating] = useState(false);

  const detectProvider = (key: string): string => {
    if (key.startsWith('sk-ant-')) return 'anthropic';
    if (key.startsWith('AIza')) return 'gemini';
    return 'openai';
  };

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth/login');
    } else if (user) {
      setFullName(user.full_name || '');
    }
  }, [isAuthenticated, user, router]);

  useEffect(() => {
    if (isAuthenticated) {
      loadAiSettings();
      loadModelSettings();
      loadApiProviders();
    }
  }, [isAuthenticated]);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const updatedUser = await api.updateProfile({ full_name: fullName });
      setUser(updatedUser);
      showMessage('success', 'Profile updated successfully!');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      showMessage('error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      showMessage('error', 'Password must be at least 8 characters long');
      return;
    }

    setLoading(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      showMessage('success', 'Password changed successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push('/auth/login');
  };

  const loadAiSettings = async () => {
    try {
      setAiLoading(true);
      const data = await api.getAiTokenSettings();
      setAiSettings(data);
      const nextForm: Record<string, string> = {};
      Object.entries(data.effective).forEach(([key, value]) => {
        nextForm[key] = String(value ?? '');
      });
      setAiForm(nextForm);
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to load AI token settings');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveAiSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAiLoading(true);
      const payload = Object.fromEntries(
        Object.entries(aiForm)
          .filter(([, value]) => value.trim() !== '')
          .map(([key, value]) => [key, Number(value)])
      );
      const data = await api.updateAiTokenSettings(payload);
      setAiSettings(data);
      const nextForm: Record<string, string> = {};
      Object.entries(data.effective).forEach(([key, value]) => {
        nextForm[key] = String(value ?? '');
      });
      setAiForm(nextForm);
      showMessage('success', 'AI token limits updated. Changes apply immediately.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to update AI token settings');
    } finally {
      setAiLoading(false);
    }
  };

  const handleResetAiSettings = () => {
    if (!aiSettings?.defaults) return;
    resetAiSettings();
  };

  const loadModelSettings = async () => {
    try {
      setModelLoading(true);
      const [modelList, modelInfo] = await Promise.all([
        api.getAvailableModels(),
        api.getCurrentModel(),
      ]);
      setModelOptions(modelList.models || []);
      setCurrentModel(modelInfo.current_model || '');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to load AI model list');
    } finally {
      setModelLoading(false);
    }
  };

  const handleUpdateModel = async (model: string) => {
    if (!model) return;
    try {
      setModelLoading(true);
      const result = await api.updateCurrentModel(model);
      setCurrentModel(result.current_model);
      showMessage('success', `AI model switched to ${result.current_model}.`);
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to update AI model');
    } finally {
      setModelLoading(false);
    }
  };

  const loadApiProviders = async () => {
    try {
      const data = await api.getApiProviders();
      setApiProviders(data);
    } catch {
      // ignore
    }
  };

  const handleSaveApiKey = async () => {
    const key = extApiKey.trim();
    if (!key) return showMessage('error', 'Please enter an API key.');
    const provider = detectProvider(key);
    try {
      setExtSaving(true);
      await api.saveApiKey(provider, key, undefined, true);
      await api.activateProvider(provider);
      setExtApiKey('');
      await loadApiProviders();
      showMessage('success', 'API key saved — now using it for AI generation.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to save API key');
    } finally {
      setExtSaving(false);
    }
  };

  const handleDeleteApiKey = async (provider: string) => {
    if (!confirm(`Remove your ${provider} API key and switch back to Ollama?`)) return;
    try {
      setExtDeleting(true);
      await api.deleteApiKey(provider);
      await api.activateProvider('ollama').catch(() => {});
      await loadApiProviders();
      showMessage('success', 'External key removed. Using Ollama again.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to remove key');
    } finally {
      setExtDeleting(false);
    }
  };

  const handleActivateProvider = async (provider: string) => {
    try {
      setActivating(true);
      await api.activateProvider(provider);
      await loadApiProviders();
      showMessage('success', provider === 'ollama'
        ? 'Switched back to local Ollama.'
        : `Now using ${provider} for AI generation.`);
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to switch provider');
    } finally {
      setActivating(false);
    }
  };

  const resetAiSettings = async () => {
    try {
      setAiLoading(true);
      const data = await api.resetAiTokenSettings();
      setAiSettings(data);
      const nextForm: Record<string, string> = {};
      Object.entries(data.effective).forEach(([key, value]) => {
        nextForm[key] = String(value ?? '');
      });
      setAiForm(nextForm);
      showMessage('success', 'AI token limits reset to defaults.');
    } catch (error: any) {
      showMessage('error', error.response?.data?.detail || 'Failed to reset AI token settings');
    } finally {
      setAiLoading(false);
    }
  };

  const tokenFields = [
    { key: 'max_tokens_story_generation', label: 'Story Generation', hint: 'Continuation and core generation' },
    { key: 'max_tokens_recap', label: 'Recap', hint: 'Story recap outputs' },
    { key: 'max_tokens_summary', label: 'Summary', hint: 'Chapter and story summaries' },
    { key: 'max_tokens_grammar', label: 'Grammar Check', hint: 'Grammar and style analysis' },
    { key: 'max_tokens_branching', label: 'Branching', hint: 'Preview length for branches' },
    { key: 'max_tokens_story_to_image_prompt', label: 'Story-to-Image Prompt', hint: 'Image prompt generation' },
    { key: 'max_tokens_image_to_story', label: 'Image-to-Story', hint: 'Story generation from images' },
    { key: 'max_tokens_character_extraction', label: 'Character Extraction', hint: 'Extract characters from chapters' },
    { key: 'max_tokens_rewrite', label: 'Rewrite', hint: 'Rewrite tool outputs' },
    { key: 'max_tokens_story_bible', label: 'Narrative Codex', hint: 'Codex generation' },
    { key: 'max_tokens_story_bible_update', label: 'Codex Update', hint: 'Incremental codex updates' },
    { key: 'max_tokens_import_story', label: 'Import Story', hint: 'AI extraction during story import' },
  ];

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-background">
      <Sidebar />
      
      <main className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-text-primary mb-2">
              Settings
            </h1>
            <p className="text-text-secondary">
              Manage your account settings and preferences
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success' 
                ? 'bg-green-500/10 border-green-500/30 text-green-500' 
                : 'bg-red-500/10 border-red-500/30 text-red-500'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-4 border-b border-surface-border mb-6">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'profile'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Profile
            </button>
            <button
              onClick={() => setActiveTab('account')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'account'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              Account
            </button>
            <button
              onClick={() => setActiveTab('ai')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'ai'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
            >
              AI
            </button>
          </div>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Username
                    </label>
                    <input
                      type="text"
                      value={user?.username || ''}
                      disabled
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary disabled:opacity-60"
                    />
                    <p className="text-xs text-text-tertiary mt-1">Username cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </label>
                    <input
                      type="email"
                      value={user?.email || ''}
                      disabled
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary disabled:opacity-60"
                    />
                    <p className="text-xs text-text-tertiary mt-1">Email cannot be changed</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                    />
                  </div>

                  <div className="pt-4">
                    <Button type="submit" isLoading={loading} className="flex items-center gap-2">
                      <Save className="w-4 h-4" />
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </form>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              {/* Change Password */}
              <form onSubmit={handleChangePassword} className="bg-surface border border-border rounded-xl p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Change Password
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Current Password
                    </label>
                    <div className="relative">
                      <input
                        type={showCurrentPassword ? "text" : "password"}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter current password"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                      >
                        {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showNewPassword ? "text" : "password"}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Enter new password (min 8 characters)"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-text-secondary mb-2">
                      Confirm New Password
                    </label>
                    <div className="relative">
                      <input
                        type={showConfirmPassword ? "text" : "password"}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Confirm new password"
                        className="w-full px-4 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50 pr-10"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-primary"
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2">
                    <Button type="submit" isLoading={loading} className="flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Change Password
                    </Button>
                  </div>
                </div>
              </form>

              {/* Sign Out */}
              <div className="bg-surface border border-red-500/20 rounded-xl p-6">
                <h2 className="text-xl font-semibold text-text-primary mb-4 flex items-center gap-2">
                  <LogOut className="w-5 h-5 text-red-500" />
                  Session
                </h2>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-text-secondary mb-4">
                      Sign out of your account on this device.
                    </p>
                    <Button 
                      variant="secondary" 
                      onClick={handleLogout}
                      className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border-red-500/30"
                    >
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'ai' && (
            <form onSubmit={handleSaveAiSettings} className="space-y-6">

              {/* ── Local Ollama ── */}
              <div className={`bg-surface border-2 rounded-xl p-6 transition-colors ${
                (!apiProviders || apiProviders.active_provider === 'ollama')
                  ? 'border-accent'
                  : 'border-border'
              }`}>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                      🖥️ Local AI (Ollama)
                      {(!apiProviders || apiProviders.active_provider === 'ollama') && (
                        <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" /> Active
                        </span>
                      )}
                    </h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Run models locally — no API key required.
                    </p>
                  </div>
                  {apiProviders && apiProviders.active_provider !== 'ollama' && (
                    <button
                      type="button"
                      onClick={() => handleActivateProvider('ollama')}
                      disabled={activating}
                      className="text-sm px-3 py-1.5 rounded-lg border border-border text-text-secondary hover:text-text-primary hover:border-accent transition-colors"
                    >
                      Switch back
                    </button>
                  )}
                </div>

                <div className="space-y-3">
                  <label className="block text-sm font-medium text-text-secondary">Model</label>
                  <select
                    value={currentModel}
                    onChange={(e) => handleUpdateModel(e.target.value)}
                    disabled={modelLoading}
                    className="w-full px-3 py-2 bg-background border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                  >
                    <option value="" disabled>
                      {modelLoading ? 'Loading models…' : 'Select a model'}
                    </option>
                    {modelOptions.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ── External API Key (Optional) ── */}
              <div className={`bg-surface border-2 rounded-xl p-6 transition-colors ${
                apiProviders && apiProviders.active_provider !== 'ollama'
                  ? 'border-accent'
                  : 'border-border'
              }`}>
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-xl font-semibold text-text-primary flex items-center gap-2">
                    <Key className="w-5 h-5 text-accent" />
                    External API Key
                    <span className="text-xs font-normal text-text-tertiary">(optional)</span>
                    {apiProviders && apiProviders.active_provider !== 'ollama' && (
                      <span className="text-xs font-medium text-accent bg-accent/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Zap className="w-3 h-3" /> Active
                      </span>
                    )}
                  </h2>
                </div>
                <p className="text-sm text-text-secondary mb-5">
                  Optionally use a cloud AI provider instead of Ollama.
                </p>

                {/* Saved key info */}
                {apiProviders?.providers.filter(p => p.has_key).map(p => (
                  <div key={p.provider} className="mb-4 flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3 text-sm">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-text-secondary">API key saved</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {!p.is_active && (
                        <button
                          type="button"
                          onClick={() => handleActivateProvider(p.provider)}
                          disabled={activating}
                          className="text-xs px-2 py-1 rounded border border-accent text-accent hover:bg-accent/10 transition-colors"
                        >
                          Use this
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => handleDeleteApiKey(p.provider)}
                        disabled={extDeleting}
                        className="text-text-tertiary hover:text-red-400 transition-colors"
                        title="Remove key"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* API Key input */}
                <div className="relative">
                  <input
                    type={extShowKey ? 'text' : 'password'}
                    placeholder="Paste your API key here…"
                    value={extApiKey}
                    onChange={(e) => setExtApiKey(e.target.value)}
                    className="w-full px-3 py-2 pr-10 bg-background border border-border rounded-lg text-text-primary text-sm focus:outline-none focus:ring-2 focus:ring-accent/50"
                  />
                  <button
                    type="button"
                    onClick={() => setExtShowKey(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-tertiary hover:text-text-secondary"
                  >
                    {extShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                <div className="mt-4">
                  <button
                    type="button"
                    onClick={handleSaveApiKey}
                    disabled={extSaving || !extApiKey.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white text-sm font-medium hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {extSaving
                      ? <RefreshCw className="w-4 h-4 animate-spin" />
                      : <Save className="w-4 h-4" />}
                    Save &amp; Activate
                  </button>
                </div>
              </div>

              <div className="bg-surface border border-border rounded-xl p-6">
                <div className="flex items-start justify-between gap-4 mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-text-primary">AI Token Limits</h2>
                    <p className="text-sm text-text-secondary mt-1">
                      Adjust per-feature token caps. Changes apply immediately to your account.
                    </p>
                  </div>
                  <Button type="button" variant="secondary" onClick={handleResetAiSettings}>
                    Reset to Defaults
                  </Button>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  {tokenFields.map((field) => (
                    <div key={field.key} className="bg-background border border-border rounded-lg p-4">
                      <label className="block text-sm font-medium text-text-primary mb-1">
                        {field.label}
                      </label>
                      <p className="text-xs text-text-tertiary mb-3">{field.hint}</p>
                      <input
                        type="number"
                        min={50}
                        max={8000}
                        value={aiForm[field.key] ?? ''}
                        onChange={(e) => {
                          setAiForm((prev) => ({
                            ...prev,
                            [field.key]: e.target.value,
                          }));
                        }}
                        className="w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary focus:outline-none focus:ring-2 focus:ring-accent/50"
                      />
                      {aiSettings?.defaults?.[field.key] && (
                        <p className="text-xs text-text-tertiary mt-2">
                          Default: {aiSettings.defaults[field.key]}
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="pt-6">
                  <Button type="submit" isLoading={aiLoading} className="flex items-center gap-2">
                    <Save className="w-4 h-4" />
                    Save Token Limits
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
