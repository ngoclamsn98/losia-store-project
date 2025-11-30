# Mail Module - Hướng dẫn sử dụng

Module gửi email sử dụng Resend cho ứng dụng backend-losia.

## Cấu hình

### 1. Cài đặt package

Package `resend` đã được cài đặt sẵn.

### 2. Cấu hình biến môi trường

Thêm các biến sau vào file `.env`:

```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxxxxxxxx
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

**Lưu ý:** 
- Đăng ký tài khoản tại [https://resend.com](https://resend.com) để lấy API key
- Email gửi đi phải được verify domain trên Resend (hoặc dùng email test của Resend)

## Sử dụng

### Import MailModule

MailModule đã được đăng ký trong `app.module.ts` và có thể sử dụng trong bất kỳ module nào.

### Inject MailService

```typescript
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class YourService {
  constructor(private readonly mailService: MailService) {}

  async someMethod() {
    // Sử dụng mail service ở đây
  }
}
```

### Các phương thức có sẵn

#### 1. Gửi email chào mừng

```typescript
await this.mailService.sendWelcomeEmail(
  'user@example.com',
  'Tên người dùng'
);
```

#### 2. Gửi email reset password

```typescript
await this.mailService.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-here'
);
```

#### 3. Gửi email xác nhận đơn hàng

```typescript
const orderDetails = {
  orderNumber: 'ORD-12345',
  customerName: 'Nguyễn Văn A',
  items: [
    { name: 'Áo thun organic', quantity: 2, price: 250000 },
    { name: 'Quần jeans tái chế', quantity: 1, price: 450000 },
  ],
  totalAmount: 950000,
  shippingAddress: '123 Đường ABC, Quận 1, TP.HCM',
  orderDate: '24/11/2024',
};

await this.mailService.sendOrderConfirmationEmail(
  'user@example.com',
  orderDetails
);
```

#### 4. Gửi email tùy chỉnh

```typescript
import { SendEmailDto } from '../mail/dto/send-email.dto';

const emailDto: SendEmailDto = {
  to: 'user@example.com',
  subject: 'Tiêu đề email',
  html: '<h1>Nội dung email</h1><p>Đây là email tùy chỉnh</p>',
  from: 'custom@yourdomain.com', // Optional
};

await this.mailService.sendEmail(emailDto);
```

## Ví dụ thực tế

### Gửi email chào mừng khi đăng ký

```typescript
// auth.service.ts
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(private readonly mailService: MailService) {}

  async register(registerDto: RegisterDto) {
    // Tạo user mới
    const user = await this.usersService.create(registerDto);

    // Gửi email chào mừng
    try {
      await this.mailService.sendWelcomeEmail(
        user.email,
        user.name
      );
    } catch (error) {
      // Log lỗi nhưng không fail registration
      console.error('Failed to send welcome email:', error);
    }

    return user;
  }
}
```

### Gửi email reset password

```typescript
// auth.service.ts
async forgotPassword(email: string) {
  const user = await this.usersService.findByEmail(email);
  
  if (!user) {
    throw new NotFoundException('User not found');
  }

  // Tạo reset token
  const resetToken = this.generateResetToken();
  await this.saveResetToken(user.id, resetToken);

  // Gửi email
  await this.mailService.sendPasswordResetEmail(
    user.email,
    resetToken
  );

  return { message: 'Password reset email sent' };
}
```

### Gửi email xác nhận đơn hàng

```typescript
// orders.service.ts
import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class OrdersService {
  constructor(private readonly mailService: MailService) {}

  async createOrder(createOrderDto: CreateOrderDto, userId: string) {
    // Tạo đơn hàng
    const order = await this.ordersRepository.save({
      ...createOrderDto,
      userId,
    });

    // Lấy thông tin user
    const user = await this.usersService.findOne(userId);

    // Chuẩn bị dữ liệu email
    const orderDetails = {
      orderNumber: order.id,
      customerName: user.name,
      items: order.items.map(item => ({
        name: item.product.name,
        quantity: item.quantity,
        price: item.price,
      })),
      totalAmount: order.totalAmount,
      shippingAddress: order.shippingAddress,
      orderDate: new Date().toLocaleDateString('vi-VN'),
    };

    // Gửi email xác nhận
    try {
      await this.mailService.sendOrderConfirmationEmail(
        user.email,
        orderDetails
      );
    } catch (error) {
      console.error('Failed to send order confirmation email:', error);
    }

    return order;
  }
}
```

## Tùy chỉnh templates

Các template email nằm trong thư mục `src/mail/templates/`:

- `welcome.template.ts` - Email chào mừng
- `password-reset.template.ts` - Email reset password
- `order-confirmation.template.ts` - Email xác nhận đơn hàng

Bạn có thể chỉnh sửa các template này để thay đổi giao diện và nội dung email.

## Lưu ý

1. **Error handling**: Nên wrap các lệnh gửi email trong try-catch để tránh fail toàn bộ request nếu email gửi thất bại
2. **Async operations**: Tất cả các phương thức gửi email đều là async
3. **Logging**: Service tự động log các email được gửi và lỗi nếu có
4. **Environment**: Đảm bảo đã cấu hình đúng `RESEND_API_KEY` và `RESEND_FROM_EMAIL` trong file `.env`

## Testing

Để test email trong môi trường development, bạn có thể:

1. Sử dụng email test của Resend (không cần verify domain)
2. Kiểm tra email đã gửi trong Resend Dashboard
3. Sử dụng email thật của bạn để nhận email test
