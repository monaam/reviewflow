import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { routes } from '../utils/routes';

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [generalError, setGeneralError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');
    setIsLoading(true);

    try {
      await signup(name, email, password, passwordConfirmation);
      navigate(routes.studio.dashboard());
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      if (error.response?.data?.errors) {
        setErrors(error.response.data.errors);
      } else {
        setGeneralError(error.response?.data?.message || 'Registration failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const firstError = (field: string) => errors[field]?.[0];

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo.svg" alt="Briefloop" className="h-16 w-auto mx-auto dark:hidden" />
          <img src="/logo-dark.svg" alt="Briefloop" className="h-16 w-auto mx-auto hidden dark:block" />
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Creative Review & Approval Platform
          </p>
        </div>

        <div className="card p-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
            Create your account
          </h2>

          {generalError && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
              {generalError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="label">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="input"
                required
              />
              {firstError('name') && (
                <p className="mt-1 text-sm text-red-600">{firstError('name')}</p>
              )}
            </div>

            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                required
              />
              {firstError('email') && (
                <p className="mt-1 text-sm text-red-600">{firstError('email')}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input"
                minLength={8}
                required
              />
              {firstError('password') && (
                <p className="mt-1 text-sm text-red-600">{firstError('password')}</p>
              )}
            </div>

            <div>
              <label htmlFor="password_confirmation" className="label">
                Confirm Password
              </label>
              <input
                id="password_confirmation"
                type="password"
                value={passwordConfirmation}
                onChange={(e) => setPasswordConfirmation(e.target.value)}
                className="input"
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full"
            >
              {isLoading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to={routes.login()} className="text-brand-600 hover:text-brand-500 font-medium">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
