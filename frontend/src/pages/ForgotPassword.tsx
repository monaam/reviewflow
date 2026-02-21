import { useState } from 'react';
import { Link } from 'react-router-dom';
import { authApi } from '../api/auth';
import { routes } from '../utils/routes';

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await authApi.forgotPassword(email);
      setIsSubmitted(true);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(error.response?.data?.message || 'Something went wrong. Please try again.');
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
          {isSubmitted ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                Check your email
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                If an account with <strong>{email}</strong> exists, we've sent a password reset link. Please check your inbox.
              </p>
              <Link
                to={routes.login()}
                className="btn-primary w-full inline-block text-center"
              >
                Back to login
              </Link>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Forgot your password?
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Enter your email and we'll send you a link to reset your password.
              </p>

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
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
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn-primary w-full"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
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
