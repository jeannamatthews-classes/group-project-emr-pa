type SendVerificationCodeEmailInput = {
  toEmail: string;
  code: string;
  expiresInMinutes: number;
};

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST?.trim() &&
      process.env.SMTP_PORT?.trim() &&
      process.env.SMTP_USER?.trim() &&
      process.env.SMTP_PASS?.trim() &&
      process.env.SMTP_FROM?.trim()
  );
}

export async function sendVerificationCodeEmail(input: SendVerificationCodeEmailInput): Promise<void> {
  const subject = 'Verify your email';
  const frontendUrl = (process.env.FRONTEND_APP_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const verificationUrl = `${frontendUrl}/verify-email?email=${encodeURIComponent(
    input.toEmail
  )}&code=${encodeURIComponent(input.code)}`;
  const text = [
    `Verify your EMR-PA account by opening this link: ${verificationUrl}`,
    '',
    `You can also enter this verification code manually: ${input.code}`,
    `This code expires in ${input.expiresInMinutes} minutes.`,
  ].join('\n');
  const html = `
    <p>Verify your EMR-PA account by opening this link:</p>
    <p><a href="${verificationUrl}">Verify my email</a></p>
    <p>You can also enter this verification code manually: <strong>${input.code}</strong></p>
    <p>This code expires in ${input.expiresInMinutes} minutes.</p>
  `;

  if (!isSmtpConfigured()) {
    // Development fallback so backend flow can be tested before SMTP is wired.
    console.log(`[email-dev] To: ${input.toEmail} | Subject: ${subject} | Body: ${text}`);
    return;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST?.trim(),
    port: Number(process.env.SMTP_PORT?.trim()),
    secure: process.env.SMTP_SECURE?.trim() === 'true',
    auth: {
      user: process.env.SMTP_USER?.trim(),
      pass: process.env.SMTP_PASS?.trim(),
    },
  });

  try {
    await transporter.sendMail({
      from: process.env.SMTP_FROM?.trim(),
      to: input.toEmail,
      subject,
      text,
      html,
    });
  } catch (error) {
    const smtpError = error as { code?: string; responseCode?: number };
    if (smtpError.code === 'EAUTH' || smtpError.responseCode === 535) {
      throw new Error(
        'Gmail rejected the SMTP username or app password. Regenerate the Google App Password for this exact Gmail account, update SMTP_PASS, and restart the backend.'
      );
    }

    throw error;
  }
}
