import { getBaseEmailLayout } from './email-layout';

export const getForgotPasswordEmail = (resetLink: string): string => {
  const content = `
    <h1>Password Reset Request</h1>
    <p>Hello,</p>
    <p>We received a request to reset the password for your account. If you made this request, please click the button below to set a new securely protected password.</p>
    
    <div style="text-align: center;">
        <a href="${resetLink}" class="btn">Reset My Password</a>
    </div>
    
    <p>If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="word-break: break-all; color: #0056b3;"><a href="${resetLink}">${resetLink}</a></p>
    
    <p>If you did not request a password reset, you can safely ignore this email. Your account remains secure.</p>
  `;

  return getBaseEmailLayout(content, 'Reset Your Password');
};
