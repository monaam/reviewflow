<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{ $title ?? 'Briefloop' }}</title>
    <!--[if mso]>
    <noscript>
        <xml>
            <o:OfficeDocumentSettings>
                <o:PixelsPerInch>96</o:PixelsPerInch>
            </o:OfficeDocumentSettings>
        </xml>
    </noscript>
    <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: #030712; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #030712; min-height: 100vh;">
        <tr>
            <td align="center" style="padding: 40px 16px;">
                <!-- Logo -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
                    <tr>
                        <td align="center" style="padding-bottom: 32px;">
                            <img src="{{ config('app.frontend_url') }}/logo-dark.svg" alt="Briefloop" width="160" height="56" style="display: block; border: 0; height: auto; max-width: 160px;" />
                        </td>
                    </tr>
                </table>

                <!-- Content Card -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px; background-color: #111827; border-radius: 12px; border: 1px solid #1f2937;">
                    <tr>
                        <td style="padding: 40px 32px;">
                            @yield('content')
                        </td>
                    </tr>
                </table>

                <!-- Footer -->
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 480px;">
                    <tr>
                        <td align="center" style="padding-top: 24px;">
                            <p style="margin: 0; font-size: 13px; color: #6b7280;">&copy; {{ date('Y') }} Briefloop. All rights reserved.</p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
