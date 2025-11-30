export const getPasswordResetEmailTemplate = (resetToken: string): string => {
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3002'}/reset-password?token=${resetToken}`;

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Đặt lại mật khẩu</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f4f4f4;
        }
        .container {
          background-color: #ffffff;
          border-radius: 10px;
          padding: 40px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #2ecc71;
          margin-bottom: 10px;
        }
        h1 {
          color: #2c3e50;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .content {
          color: #555;
          font-size: 16px;
          margin-bottom: 30px;
        }
        .button {
          display: inline-block;
          padding: 12px 30px;
          background-color: #e74c3c;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .warning {
          background-color: #fff3cd;
          border-left: 4px solid #ffc107;
          padding: 15px;
          margin: 20px 0;
          border-radius: 4px;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 14px;
        }
        .token-box {
          background-color: #f8f9fa;
          border: 1px solid #dee2e6;
          border-radius: 5px;
          padding: 15px;
          margin: 20px 0;
          font-family: monospace;
          word-break: break-all;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌱 LOSIA</div>
        </div>
        
        <h1>Đặt lại mật khẩu</h1>
        
        <div class="content">
          <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn.</p>
          
          <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu của bạn:</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${resetUrl}" class="button">
            Đặt lại mật khẩu
          </a>
        </div>
        
        <div class="content">
          <p>Hoặc copy link sau vào trình duyệt:</p>
          <div class="token-box">
            ${resetUrl}
          </div>
        </div>
        
        <div class="warning">
          <strong>⚠️ Lưu ý:</strong> Link này sẽ hết hạn sau 1 giờ. Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.
        </div>
        
        <div class="footer">
          <p>© 2024 Losia. All rights reserved.</p>
          <p>Nếu bạn gặp vấn đề, vui lòng liên hệ với chúng tôi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
