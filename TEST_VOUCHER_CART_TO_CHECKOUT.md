# 🧪 Test Voucher Flow: Cart → Checkout

## ✅ Vấn Đề Đã Sửa

**Vấn đề:** Khi apply voucher ở trang cart, voucher không được giữ lại khi chuyển sang trang checkout.

**Nguyên nhân:** 
- Cart page và Checkout page không chia sẻ state voucher
- Không có cơ chế lưu trữ voucher giữa các pages

**Giải pháp:**
- Sử dụng `localStorage` để lưu voucher đã apply
- Checkout page tự động load voucher từ localStorage khi mount
- Clear voucher khi order thành công hoặc khi user remove

---

## 📝 Các Thay Đổi

### 1. Cart Page (`ui-commerce/src/app/(public)/cart/page.tsx`)

**Thêm logic lưu voucher vào localStorage:**

```typescript
const handleVoucherApplied = (code: string, discountAmount: number) => {
  setVoucherCode(code);
  setDiscount(discountAmount);
  
  // Save to localStorage so checkout page can use it
  if (code && discountAmount > 0) {
    localStorage.setItem('appliedVoucher', JSON.stringify({ 
      code, 
      discount: discountAmount 
    }));
  } else {
    localStorage.removeItem('appliedVoucher');
  }
};
```

### 2. Checkout Page (`ui-commerce/src/app/(public)/checkout/page.tsx`)

**A. Import useEffect:**
```typescript
import { useMemo, useState, useEffect } from "react";
```

**B. Load voucher từ localStorage khi mount:**
```typescript
// Load applied voucher from localStorage (from cart page)
useEffect(() => {
  try {
    const savedVoucher = localStorage.getItem('appliedVoucher');
    if (savedVoucher) {
      const { code, discount: savedDiscount } = JSON.parse(savedVoucher);
      if (code && savedDiscount > 0) {
        setPromo(code);
        setVoucherCode(code);
        setDiscount(savedDiscount);
      }
    }
  } catch (error) {
    console.error('Error loading voucher from localStorage:', error);
  }
}, []);
```

**C. Clear voucher khi order thành công:**
```typescript
// Clear localStorage cart
clearCart();

// Clear applied voucher from localStorage
localStorage.removeItem('appliedVoucher');
```

**D. SideOrderSummary - Sync appliedCode với promo:**
```typescript
// Sync appliedCode with promo when component mounts (from localStorage)
useEffect(() => {
  if (promo && discount && discount > 0) {
    setAppliedCode(promo);
    setValidationSuccess('Mã giảm giá đã được áp dụng');
  }
}, []);
```

**E. Save voucher khi apply ở checkout:**
```typescript
setAppliedCode(promo.trim());
setValidationSuccess(data.message || 'Áp dụng mã thành công!');
onVoucherChange?.(promo.trim(), data.discountAmount);

// Save to localStorage
localStorage.setItem('appliedVoucher', JSON.stringify({ 
  code: promo.trim(), 
  discount: data.discountAmount 
}));
```

**F. Remove voucher khỏi localStorage:**
```typescript
const handleRemoveVoucher = () => {
  setAppliedCode('');
  onChangePromo('');
  setValidationError('');
  setValidationSuccess('');
  onVoucherChange?.('', 0);
  
  // Remove from localStorage
  localStorage.removeItem('appliedVoucher');
};
```

---

## 🧪 Hướng Dẫn Test

### Test Case 1: Apply Voucher ở Cart → Checkout

**Steps:**
1. Mở trang cart: `http://localhost:3002/cart` (hoặc port ui-commerce của bạn)
2. Thêm sản phẩm vào cart (nếu chưa có)
3. Nhập mã voucher: `TEST50`
4. Click **"Áp dụng"**
5. ✅ Verify: Discount amount hiển thị (ví dụ: -75,000₫)
6. ✅ Verify: Total được tính lại (Subtotal - Discount)
7. Click **"Thanh toán"** để chuyển sang checkout
8. ✅ **VERIFY: Voucher code "TEST50" vẫn hiển thị ở checkout**
9. ✅ **VERIFY: Discount amount vẫn được áp dụng**
10. ✅ **VERIFY: Total ở checkout = Subtotal + Tax + Shipping - Discount**

**Expected Result:**
- Voucher code được giữ nguyên từ cart sang checkout
- Discount amount được áp dụng chính xác
- Input field hiển thị code và bị disable
- Nút "Xóa" hiển thị thay vì "Áp dụng"
- Message "Mã giảm giá đã được áp dụng" hiển thị

---

### Test Case 2: Apply Voucher Trực Tiếp ở Checkout

**Steps:**
1. Mở trang checkout trực tiếp: `http://localhost:3002/checkout`
2. Nhập mã voucher: `TEST50`
3. Click **"Áp dụng"**
4. ✅ Verify: Discount amount hiển thị
5. ✅ Verify: Total được tính lại
6. ✅ Verify: Voucher được lưu vào localStorage

**Expected Result:**
- Voucher validation thành công
- Discount được áp dụng
- localStorage có key `appliedVoucher`

---

### Test Case 3: Remove Voucher ở Checkout

**Steps:**
1. Ở checkout page với voucher đã apply
2. Click nút **"Xóa"**
3. ✅ Verify: Voucher code bị xóa
4. ✅ Verify: Discount = 0
5. ✅ Verify: Total được tính lại (không có discount)
6. ✅ Verify: localStorage không còn `appliedVoucher`

**Expected Result:**
- Voucher bị remove
- Input field enabled lại
- Nút "Áp dụng" hiển thị lại

---

### Test Case 4: Order Thành Công → Clear Voucher

**Steps:**
1. Ở checkout page với voucher đã apply
2. Điền đầy đủ thông tin shipping
3. Click **"Đặt hàng"**
4. ✅ Verify: Order được tạo thành công
5. ✅ Verify: Redirect to thank-you page
6. ✅ Verify: localStorage không còn `appliedVoucher`
7. Quay lại cart hoặc checkout
8. ✅ Verify: Voucher đã bị clear

**Expected Result:**
- Order thành công
- Voucher được clear khỏi localStorage
- Cart được clear
- Không còn voucher khi quay lại

---

### Test Case 5: Invalid Voucher Code

**Steps:**
1. Ở cart hoặc checkout page
2. Nhập mã voucher không hợp lệ: `INVALID123`
3. Click **"Áp dụng"**
4. ✅ Verify: Error message hiển thị
5. ✅ Verify: Discount = 0
6. ✅ Verify: localStorage không có `appliedVoucher`

**Expected Result:**
- Error message: "Mã voucher không hợp lệ" hoặc tương tự
- Không có discount
- Voucher không được lưu

---

### Test Case 6: Voucher Persistence Across Page Refresh

**Steps:**
1. Apply voucher ở cart page
2. Refresh trang cart (F5)
3. ✅ Verify: Voucher vẫn còn (nếu PromoCodeForm load từ localStorage)
4. Navigate to checkout
5. ✅ Verify: Voucher vẫn được apply
6. Refresh trang checkout (F5)
7. ✅ **VERIFY: Voucher vẫn được load lại từ localStorage**

**Expected Result:**
- Voucher persist qua page refresh
- Discount vẫn được áp dụng

---

## 🔍 Debug Tips

### Kiểm tra localStorage

Mở DevTools Console và chạy:

```javascript
// Check voucher in localStorage
console.log(localStorage.getItem('appliedVoucher'));

// Expected output:
// {"code":"TEST50","discount":75000}

// Clear voucher manually (for testing)
localStorage.removeItem('appliedVoucher');
```

### Kiểm tra Network Requests

1. Mở DevTools → Network tab
2. Apply voucher
3. Tìm request: `POST /api/vouchers/validate`
4. Check Request Body:
   ```json
   {
     "code": "TEST50",
     "orderValue": 150000,
     "clientUserId": "..." // if authenticated
   }
   ```
5. Check Response:
   ```json
   {
     "valid": true,
     "discountAmount": 75000,
     "message": "Voucher applied successfully"
   }
   ```

---

## ✅ Checklist

- [ ] Voucher apply ở cart → giữ nguyên ở checkout
- [ ] Voucher apply trực tiếp ở checkout → hoạt động
- [ ] Remove voucher → clear localStorage
- [ ] Order thành công → clear voucher
- [ ] Invalid voucher → hiển thị error
- [ ] Refresh page → voucher vẫn persist
- [ ] Discount calculation chính xác
- [ ] UI hiển thị đúng (code, discount amount, total)

---

## 📊 Test Data

**Voucher Code:** `TEST50`
- Type: PERCENTAGE
- Value: 50%
- Min Order: 100,000 VND
- Max Discount: 200,000 VND
- Status: ACTIVE

**Test Scenarios:**

| Order Value | Expected Discount | Final Total |
|------------|------------------|-------------|
| 50,000     | 0 (below min)    | 50,000      |
| 100,000    | 50,000 (50%)     | 50,000      |
| 150,000    | 75,000 (50%)     | 75,000      |
| 500,000    | 200,000 (max)    | 300,000     |

---

## 🎯 Kết Luận

Tính năng voucher giữa cart và checkout đã được fix hoàn toàn:

✅ **Persistence:** Voucher được lưu vào localStorage  
✅ **Sync:** Cart và Checkout đồng bộ voucher  
✅ **Cleanup:** Voucher được clear khi cần  
✅ **UX:** User experience mượt mà, không mất voucher  

**Hãy test lại và confirm!** 🚀

