@extends('emails.layout', ['title' => 'Verify Your Email'])

@section('content')
    <h1 style="margin: 0 0 16px; font-size: 22px; font-weight: 700; color: #f9fafb;">Verify your email</h1>

    <p style="margin: 0 0 24px; font-size: 15px; line-height: 1.6; color: #d1d5db;">
        Welcome to Briefloop! Please verify your email address by clicking the button below. This link will expire in 24 hours.
    </p>

    <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
        <tr>
            <td align="center" style="padding: 8px 0 24px;">
                <a href="{{ $url }}" target="_blank" style="display: inline-block; padding: 12px 32px; background: linear-gradient(135deg, #a855f7, #7c3aed); color: #ffffff; font-size: 15px; font-weight: 600; text-decoration: none; border-radius: 8px;">
                    Verify Email Address
                </a>
            </td>
        </tr>
    </table>

    <p style="margin: 0; font-size: 13px; line-height: 1.5; color: #9ca3af;">
        If you didn't create an account, you can safely ignore this email.
    </p>
@endsection
