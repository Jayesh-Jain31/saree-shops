const verifyEmailTemplate = ({ name, url }) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Verify your email</title>
</head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:32px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;max-width:560px;width:100%;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#ec4899,#f43f5e);padding:32px 40px;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:26px;font-weight:800;letter-spacing:-0.5px;">Welcome to Sarees Store!</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.85);font-size:14px;">You're almost there — just verify your email</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 40px;">
              <p style="margin:0 0 16px;font-size:16px;color:#374151;">Hi <strong>${name}</strong>,</p>
              <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
                Thank you for creating your account. Click the button below to verify your email address and start shopping the finest sarees.
              </p>

              <!-- Button -->
              <div style="text-align:center;margin:32px 0;">
                <a href="${url}"
                   style="display:inline-block;background:linear-gradient(135deg,#ec4899,#f43f5e);color:#ffffff;font-size:16px;font-weight:700;text-decoration:none;padding:14px 40px;border-radius:8px;letter-spacing:0.3px;">
                  Verify Email Address
                </a>
              </div>

              <p style="margin:24px 0 0;font-size:13px;color:#9ca3af;text-align:center;">
                Button not working? Copy and paste this link into your browser:
              </p>
              <p style="margin:6px 0 0;font-size:12px;color:#ec4899;text-align:center;word-break:break-all;">
                ${url}
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb;padding:20px 40px;border-top:1px solid #e5e7eb;text-align:center;">
              <p style="margin:0;font-size:12px;color:#9ca3af;">
                If you didn't create an account, you can safely ignore this email.<br/>
                © ${new Date().getFullYear()} Sarees Store. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`
}

export default verifyEmailTemplate
