import { useState } from 'react';
import { Save, Lock, User } from 'lucide-react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../stores/authStore';

export function ProfileSettingsPage() {
  const { user, setUser } = useAuthStore();
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'success' | 'error'>('success');

  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    password: '',
    password_confirmation: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setMessage('');

    try {
      const updateData: Record<string, string> = {};

      if (formData.name !== user?.name) {
        updateData.name = formData.name;
      }
      if (formData.email !== user?.email) {
        updateData.email = formData.email;
      }
      if (formData.password) {
        updateData.password = formData.password;
        updateData.password_confirmation = formData.password_confirmation;
      }

      if (Object.keys(updateData).length === 0) {
        setMessage('No changes to save');
        setMessageType('error');
        setIsSaving(false);
        return;
      }

      const response = await authApi.updateProfile(updateData);
      setUser(response.user);
      setMessage('Profile updated successfully!');
      setMessageType('success');
      setFormData((prev) => ({
        ...prev,
        password: '',
        password_confirmation: '',
      }));
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      setMessage(err.response?.data?.message || 'Failed to update profile');
      setMessageType('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Update your profile information and password
        </p>
      </div>

      {message && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            messageType === 'success'
              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
          }`}
        >
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Profile Information */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <User className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Profile Information
            </h2>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="label">
                Name
              </label>
              <input
                id="name"
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="input"
                required
              />
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                className="input"
                required
              />
            </div>
          </div>
        </div>

        {/* Change Password */}
        <div className="card p-6">
          <div className="flex items-center mb-4">
            <Lock className="w-5 h-5 text-primary-600 mr-2" />
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Change Password
            </h2>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Leave blank to keep your current password
          </p>

          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="label">
                New Password
              </label>
              <input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                className="input"
                minLength={8}
                placeholder="Minimum 8 characters"
              />
            </div>

            <div>
              <label htmlFor="password_confirmation" className="label">
                Confirm New Password
              </label>
              <input
                id="password_confirmation"
                type="password"
                value={formData.password_confirmation}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    password_confirmation: e.target.value,
                  })
                }
                className="input"
                minLength={8}
                placeholder="Re-enter your new password"
              />
              {formData.password &&
                formData.password_confirmation &&
                formData.password !== formData.password_confirmation && (
                  <p className="mt-1 text-sm text-red-600">
                    Passwords do not match
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={
              isSaving ||
              (formData.password !== '' &&
                formData.password !== formData.password_confirmation)
            }
            className="btn-primary"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
