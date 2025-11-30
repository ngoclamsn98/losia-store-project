interface OrderItem {
    name: string;
    quantity: number;
    price: number;
}

interface OrderDetails {
    orderNumber: string;
    customerName: string;
    items: OrderItem[];
    totalAmount: number;
    shippingAddress: string;
    orderDate: string;
}

export const getOrderConfirmationEmailTemplate = (orderDetails: OrderDetails): string => {
    const itemsHtml = orderDetails.items
        .map(
            (item) => `
      <tr>
        <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toLocaleString('vi-VN')}₫</td>
      </tr>
    `,
        )
        .join('');

    return `
    <!DOCTYPE html>
    <html lang="vi">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Xác nhận đơn hàng</title>
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
        .order-info {
          background-color: #f8f9fa;
          border-radius: 5px;
          padding: 20px;
          margin: 20px 0;
        }
        .order-info-item {
          margin: 10px 0;
        }
        .order-info-label {
          font-weight: bold;
          color: #2c3e50;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        th {
          background-color: #2ecc71;
          color: white;
          padding: 12px;
          text-align: left;
        }
        .total-row {
          font-weight: bold;
          font-size: 18px;
          background-color: #f8f9fa;
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
        
        <h1>✅ Đơn hàng đã được xác nhận!</h1>
        
        <div class="content">
          <p>Xin chào ${orderDetails.customerName},</p>
          <p>Cảm ơn bạn đã đặt hàng tại Losia! Đơn hàng của bạn đã được xác nhận và đang được xử lý.</p>
        </div>
        
        <div class="order-info">
          <div class="order-info-item">
            <span class="order-info-label">Mã đơn hàng:</span> #${orderDetails.orderNumber}
          </div>
          <div class="order-info-item">
            <span class="order-info-label">Ngày đặt hàng:</span> ${orderDetails.orderDate}
          </div>
          <div class="order-info-item">
            <span class="order-info-label">Địa chỉ giao hàng:</span> ${orderDetails.shippingAddress}
          </div>
        </div>
        
        <h2 style="color: #2c3e50; font-size: 20px; margin-top: 30px;">Chi tiết đơn hàng</h2>
        
        <table>
          <thead>
            <tr>
              <th>Sản phẩm</th>
              <th style="text-align: center;">Số lượng</th>
              <th style="text-align: right;">Giá</th>
            </tr>
          </thead>
          <tbody>
            ${itemsHtml}
            <tr class="total-row">
              <td colspan="2" style="padding: 15px; text-align: right;">Tổng cộng:</td>
              <td style="padding: 15px; text-align: right; color: #2ecc71;">${orderDetails.totalAmount.toLocaleString('vi-VN')}₫</td>
            </tr>
          </tbody>
        </table>
        
        <div class="content">
          <p>Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao cho đơn vị vận chuyển.</p>
        </div>
        
        <div style="text-align: center;">
          <a href="${process.env.FRONTEND_URL || 'http://localhost:3002'}/orders/${orderDetails.orderNumber}" class="button">
            Xem chi tiết đơn hàng
          </a>
        </div>
        
        <div class="footer">
          <p>© 2024 Losia. All rights reserved.</p>
          <p>Nếu bạn có bất kỳ câu hỏi nào về đơn hàng, vui lòng liên hệ với chúng tôi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
};
