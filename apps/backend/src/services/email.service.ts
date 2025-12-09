// apps/backend/src/services/email.service.ts
import nodemailer from 'nodemailer';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  static async sendVerificationEmail(email: string, token: string) {
    // 🔒 防呆檢查：確保環境變數已設定
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
        console.error('❌ Missing FRONTEND_URL in .env');
        throw new Error('系統設定錯誤：缺少前端網址設定');
    }

    // 移除結尾斜線 (避免產生 //verify-email)
    const baseUrl = frontendUrl.replace(/\/$/, ''); 
    const verificationUrl = `${baseUrl}/verify-email?token=${token}`;

    const mailOptions = {
      from: `"My E-Commerce" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '【請驗證您的信箱】啟用帳號通知',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>歡迎加入！</h2>
          <p>請點擊下方按鈕以啟用您的帳號：</p>
          <a href="${verificationUrl}" style="background-color: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">驗證信箱</a>
          <p>或複製此連結：<br>${verificationUrl}</p>
          <p>此連結將在 24 小時後失效。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Verification sent to ${email}`);
    } catch (error) {
      console.error('[Email Error]', error);
      throw new Error('郵件發送失敗，請稍後再試');
    }
  }

  static async sendPasswordResetEmail(email: string, token: string) {
    const frontendUrl = process.env.FRONTEND_URL;
    if (!frontendUrl) {
      console.error('❌ Missing FRONTEND_URL in .env');
      throw new Error('系統設定錯誤：缺少前端網址設定');
    }

    const baseUrl = frontendUrl.replace(/\/$/, '');
    const resetUrl = `${baseUrl}/reset-password?token=${token}`;

    const mailOptions = {
      from: `"My E-Commerce" <${process.env.SMTP_USER}>`,
      to: email,
      subject: '【重設密碼】密碼重設請求',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #333;">重設您的密碼</h2>
          <p>您好，</p>
          <p>我們收到了您的密碼重設請求。請點擊下方按鈕以重設您的密碼：</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" 
               style="background-color: #000; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              重設密碼
            </a>
          </div>
          <p>或複製此連結到瀏覽器：<br>
          <a href="${resetUrl}" style="color: #007bff; word-break: break-all;">${resetUrl}</a></p>
          <p style="color: #666; font-size: 14px;">⚠️ 此連結將在 1 小時後失效。</p>
          <p style="color: #666; font-size: 14px;">如果您沒有提出此請求，請忽略此郵件。</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">此為系統自動發送的郵件，請勿直接回覆。</p>
        </div>
      `,
    };

    try {
      await this.transporter.sendMail(mailOptions);
      console.log(`[Email] Password reset sent to ${email}`);
    } catch (error) {
      console.error('[Email Error]', error);
      throw new Error('郵件發送失敗，請稍後再試');
    }
  }
}