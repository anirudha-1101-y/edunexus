import React, { useState } from 'react';
import { MainLayout } from '../components/layout/MainLayout';
import { PageHeader } from '../components/layout/PageHeader';
import { StatusBadge } from '../components/ui/StatusBadge';
import { useRole } from '../context/RoleContext';
import { useToast } from '../context/ToastContext';
import {
  User,
  Mail,
  Phone,
  Building,
  KeyRound,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Save,
  Bell,
  Eye,
  EyeOff,
} from 'lucide-react';

export default function ProfilePage() {
  const { currentUser, currentRole } = useRole();
  const { success, error } = useToast();

  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'preferences'>('profile');

  // Profile Form State
  const [formData, setFormData] = useState({
    name: currentUser.name,
    email: currentUser.email,
    phone: currentUser.phone,
    department: currentUser.department || 'Central Administration',
    designation: currentUser.designation || 'Lead Officer',
    address: '124 Academic Way, Tech Valley, CA 94025',
    bio: 'Dedicated education operations professional focused on academic integrity and institutional data accuracy.',
  });

  // Password Change State
  const [passwordState, setPasswordState] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);

  // Preferences State
  const [preferences, setPreferences] = useState({
    emailAlerts: true,
    smsAlerts: false,
    sessionTimeout: '30',
    twoFactorAuth: true,
  });

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault();
    success('Profile Updated', 'Personal details saved successfully.');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordState.currentPassword) {
      error('Current Password Required', 'Please enter your existing password to proceed.');
      return;
    }
    if (passwordState.newPassword.length < 8) {
      error('Password Too Weak', 'New password must be at least 8 characters long.');
      return;
    }
    if (passwordState.newPassword !== passwordState.confirmPassword) {
      error('Password Mismatch', 'New password and confirmation do not match.');
      return;
    }
    success('Password Changed', 'Security credentials updated securely.');
    setPasswordState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  };

  // Determine if editing fields is permitted for current role
  const isSelfServiceRestricted = currentRole === 'Student' || currentRole === 'Parent';

  return (
    <MainLayout>
      <PageHeader
        title="Personal Profile & Credentials"
        subtitle="Manage your identity credentials, role permissions, multi-factor security, and communication preferences."
        breadcrumbs={[{ label: 'My Profile' }]}
      />

      {/* Profile Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-6 flex flex-col md:flex-row items-center md:items-start space-y-4 md:space-y-0 md:space-x-6">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white font-extrabold text-2xl flex items-center justify-center shadow-lg ring-4 ring-blue-50 flex-shrink-0">
          {currentUser.name
            .split(' ')
            .map((n) => n[0])
            .join('')
            .slice(0, 2)}
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex flex-col md:flex-row md:items-center space-y-1 md:space-y-0 md:space-x-3">
            <h2 className="text-xl font-extrabold text-slate-900">{currentUser.name}</h2>
            <StatusBadge status={currentUser.status} />
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
              {currentUser.role}
            </span>
          </div>

          <div className="mt-2 flex flex-wrap justify-center md:justify-start gap-4 text-xs text-slate-500 font-medium">
            <span className="flex items-center">
              <ShieldCheck className="w-4 h-4 mr-1 text-emerald-600" />
              ID: <span className="font-mono text-slate-800 ml-1">{currentUser.idNumber}</span>
            </span>
            <span className="flex items-center">
              <Mail className="w-4 h-4 mr-1 text-slate-400" />
              {currentUser.email}
            </span>
            <span className="flex items-center">
              <Phone className="w-4 h-4 mr-1 text-slate-400" />
              {currentUser.phone}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 mb-6 space-x-6">
        <button
          onClick={() => setActiveTab('profile')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'profile' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Personal Details
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'security' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Security & Password
        </button>
        <button
          onClick={() => setActiveTab('preferences')}
          className={`pb-3 text-sm font-semibold border-b-2 transition-colors ${
            activeTab === 'preferences' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Preferences & Alerts
        </button>
      </div>

      {/* Tab 1: Personal Details */}
      {activeTab === 'profile' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
          {isSelfServiceRestricted && (
            <div className="mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center">
              <Lock className="w-4 h-4 mr-2 text-amber-600 flex-shrink-0" />
              <span>
                Certain fields (Name, Student ID, Contact details) can only be amended by authorized institutional administrators for compliance integrity.
              </span>
            </div>
          )}

          <form onSubmit={handleProfileSave} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  disabled={isSelfServiceRestricted}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Institutional Email</label>
                <input
                  type="email"
                  disabled
                  value={formData.email}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-100 text-slate-500 cursor-not-allowed"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Assigned Department</label>
                <input
                  type="text"
                  disabled={isSelfServiceRestricted}
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Professional Bio / Notes</label>
                <textarea
                  rows={3}
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <Save className="w-3.5 h-3.5 mr-1.5" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 2: Security & Password */}
      {activeTab === 'security' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center">
            <KeyRound className="w-4 h-4 text-blue-600 mr-2" />
            Change Password
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Ensure your password is at least 8 characters long and contains numbers and symbols.
          </p>

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Current Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={passwordState.currentPassword}
                onChange={(e) => setPasswordState({ ...passwordState, currentPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••••••"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">New Secure Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={passwordState.newPassword}
                onChange={(e) => setPasswordState({ ...passwordState, newPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="At least 8 characters"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Confirm New Password</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={passwordState.confirmPassword}
                onChange={(e) => setPasswordState({ ...passwordState, confirmPassword: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Re-type new password"
              />
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showPass}
                  onChange={(e) => setShowPass(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <span>Show passwords</span>
              </label>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                Update Password
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Tab 3: Preferences & Alerts */}
      {activeTab === 'preferences' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm max-w-xl">
          <h3 className="text-sm font-bold text-slate-900 mb-1 flex items-center">
            <Bell className="w-4 h-4 text-blue-600 mr-2" />
            Communication & Session Preferences
          </h3>
          <p className="text-xs text-slate-500 mb-6">
            Configure automated event reminders and security session policies.
          </p>

          <div className="space-y-4 text-xs">
            <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">Email Digest & Announcements</span>
                <span className="text-slate-500 text-[11px]">Receive official school notices and fee schedules via email.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailAlerts}
                onChange={(e) => setPreferences({ ...preferences, emailAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">SMS Emergency Broadcasts</span>
                <span className="text-slate-500 text-[11px]">Urgent notifications regarding campus closures or weather events.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.smsAlerts}
                onChange={(e) => setPreferences({ ...preferences, smsAlerts: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-lg border border-slate-200 bg-slate-50 hover:bg-slate-100/60 cursor-pointer transition-colors">
              <div>
                <span className="font-bold text-slate-800 block">Dual-Gate Two-Factor Authentication</span>
                <span className="text-slate-500 text-[11px]">Mandatory authentication challenge on new device logins.</span>
              </div>
              <input
                type="checkbox"
                checked={preferences.twoFactorAuth}
                onChange={(e) => setPreferences({ ...preferences, twoFactorAuth: e.target.checked })}
                className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500"
              />
            </label>
          </div>

          <div className="pt-6 mt-6 border-t border-slate-100 flex justify-end">
            <button
              onClick={() => success('Preferences Saved', 'Your communication settings have been stored.')}
              className="inline-flex items-center px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-sm transition-colors"
            >
              <Save className="w-3.5 h-3.5 mr-1.5" />
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </MainLayout>
  );
}
