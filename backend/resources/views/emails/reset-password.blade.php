@extends('emails.layout', ['title' => 'Reset Your Password'])

@section('content')
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #f9fafb;">Reset your password</h1>

    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
        We received a request to reset the password for your account. Click the button below to choose a new password. This link will expire in 60 minutes.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 8px 0 24px;">
                <a href="{{ $url }}" target="_blank" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                    Reset Password
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">
        If you didn't request a password reset, no action is needed. Your password will remain unchanged.
    </p>
@endsection
