import { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { routes } from '../utils/routes';

export function ResetPasswordPage() {
  const { token } = useParams<{ token: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const email = searchParams.get('email') || '';

  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.resetPassword({
        token: token || '',
        email,
        password,
        password_confirmation: passwordConfirmation,
      });
      setIsSuccess(true);
      setTimeout(() => navigate(routes.login()), 3000);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
      const fieldErrors = error.response?.data?.errors;
      if (fieldErrors) {
        const firstError = Object.values(fieldErrors)[0]?.[0];
        setError(firstError || 'Something went wrong.');
      } else {
        setError(error.response?.data?.message || 'Something went wrong. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

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
          {isSuccess ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Password reset successful
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your password has been reset. Redirecting you to the login page...
              </p>
              <Link
                to={routes.login()}
                className="btn-primary w-full inline-block text-center"
              >
                Go to login
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                Reset your password
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="password" className="label">
                    New Password
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
                </div>

                <div>
                  <label htmlFor="password_confirmation" className="label">
                    Confirm New Password
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
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                <Link to={routes.login()} className="text-brand-600 hover:text-brand-500 font-medium">
                  Back to login
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
