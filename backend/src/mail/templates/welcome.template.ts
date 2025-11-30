export const getWelcomeEmailTemplate = (name: string): string => {
    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Chào mừng đến với Losia</title>
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
          background-color: #2ecc71;
          color: #ffffff;
          text-decoration: none;
          border-radius: 5px;
          font-weight: bold;
          margin: 20px 0;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #eee;
          color: #999;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">🌱 LOSIA</div>
        </div>
        
        <h1>Chào mừng ${name}!</h1>
        
        <div class="content">
          <p>Cảm ơn bạn đã tham gia cộng đồng Losia - nơi mua sắm thời trang bền vững và thân thiện với môi trường.</p>
          
          <p>Chúng tôi rất vui mừng được đồng hành cùng bạn trên hành trình hướng tới một lối sống xanh và bền vững hơn.</p>
          
          <p>Hãy bắt đầu khám phá những sản phẩm tuyệt vời của chúng tôi ngay hôm nay!</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}" class="button">
            Khám phá ngay
          </a>
        </div>
        
        <div class="footer">
          <p>© 2024 Losia. All rights reserved.</p>
          <p>Nếu bạn có bất kỳ câu hỏi nào, vui lòng liên hệ với chúng tôi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
