type SendVerificationCodeEmailInput = {
  toEmail: string;
  code: string;
  expiresInMinutes: number;
};

function isSmtpConfigured(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_PORT &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.SMTP_FROM
  );
}

export async function sendVerificationCodeEmail(input: SendVerificationCodeEmailInput): Promise<void> {
  const subject = 'Verify your email';
  const text = `Your verification code is ${input.code}. It expires in ${input.expiresInMinutes} minutes.`;

  if (!isSmtpConfigured()) {
    // Development fallback so backend flow can be tested before SMTP is wired.
    console.log(`[email-dev] To: ${input.toEmail} | Subject: ${subject} | Body: ${text}`);
    return;
  }

  const nodemailer = await import('nodemailer');
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.SMTP_FROM,
    to: input.toEmail,
    subject,
    text,
  });
}
