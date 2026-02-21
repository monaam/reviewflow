import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { authApi } from '../api/auth';
import { routes } from '../utils/routes';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export function VerifyEmailPage() {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setErrorMessage('Invalid verification link.');
      return;
    }

    authApi.verifyEmail(token)
      .then(() => setStatus('success'))
      .catch((err: unknown) => {
        setStatus('error');
        const error = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
        const fieldErrors = error.response?.data?.errors;
        if (fieldErrors) {
          const firstError = Object.values(fieldErrors)[0]?.[0];
          setErrorMessage(firstError || 'Verification failed.');
        } else {
          setErrorMessage(error.response?.data?.message || 'Verification failed. The link may be invalid or expired.');
        }
      });
  }, [token]);

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

        <div className="card p-8 text-center">
          {status === 'loading' && (
            <>
              <LoadingSpinner size="lg" className="mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">Verifying your email...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Email verified
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Your email has been verified successfully.
              </p>
              <Link
                to={routes.login()}
                className="btn-primary w-full inline-block text-center"
              >
                Continue to app
              </Link>
            </>
          )}

          {status === 'error' && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <svg className="h-6 w-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Verification failed
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {errorMessage}
              </p>
              <Link
                to={routes.login()}
                className="btn-primary w-full inline-block text-center"
              >
                Go to login
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
