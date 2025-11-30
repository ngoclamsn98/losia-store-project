// DTO để tạo vận đơn Viettel Post
export interface ViettelPostCreateOrderDto {
  ORDER_NUMBER: string; // Mã đơn hàng của shop
  GROUPADDRESS_ID?: number; // ID địa chỉ lấy hàng (nếu có)
  CUS_ID?: number; // ID khách hàng VTP (nếu có)
  DELIVERY_DATE?: string; // Ngày giao hàng mong muốn
  SENDER_FULLNAME: string; // Tên người gửi
  SENDER_ADDRESS: string; // Địa chỉ người gửi
  SENDER_PHONE: string; // SĐT người gửi
  SENDER_EMAIL?: string; // Email người gửi
  SENDER_WARD?: number; // Mã phường/xã người gửi
  SENDER_DISTRICT?: number; // Mã quận/huyện người gửi
  SENDER_PROVINCE?: number; // Mã tỉnh/thành người gửi
  SENDER_LATITUDE?: number; // Vĩ độ người gửi
  SENDER_LONGITUDE?: number; // Kinh độ người gửi
  
  RECEIVER_FULLNAME: string; // Tên người nhận
  RECEIVER_ADDRESS: string; // Địa chỉ người nhận
  RECEIVER_PHONE: string; // SĐT người nhận
  RECEIVER_EMAIL?: string; // Email người nhận
  RECEIVER_WARD?: number; // Mã phường/xã người nhận
  RECEIVER_DISTRICT?: number; // Mã quận/huyện người nhận
  RECEIVER_PROVINCE?: number; // Mã tỉnh/thành người nhận
  RECEIVER_LATITUDE?: number; // Vĩ độ người nhận
  RECEIVER_LONGITUDE?: number; // Kinh độ người nhận
  
  PRODUCT_NAME: string; // Tên hàng hóa
  PRODUCT_DESCRIPTION?: string; // Mô tả hàng hóa
  PRODUCT_QUANTITY: number; // Số lượng
  PRODUCT_PRICE: number; // Giá trị hàng hóa
  PRODUCT_WEIGHT: number; // Khối lượng (gram)
  PRODUCT_LENGTH?: number; // Chiều dài (cm)
  PRODUCT_WIDTH?: number; // Chiều rộng (cm)
  PRODUCT_HEIGHT?: number; // Chiều cao (cm)
  
  PRODUCT_TYPE: string; // Loại hàng hóa (HH: Hàng hóa, TT: Tài liệu)
  ORDER_PAYMENT: number; // Hình thức thanh toán (1: Người gửi trả, 2: Người nhận trả, 3: Trả sau)
  ORDER_SERVICE: string; // Dịch vụ (VCN: Viettel chuyển nhanh, VTK: Viettel tiết kiệm, etc.)
  ORDER_SERVICE_ADD?: string; // Dịch vụ cộng thêm
  ORDER_VOUCHER?: string; // Mã voucher
  ORDER_NOTE?: string; // Ghi chú đơn hàng
  
  MONEY_COLLECTION?: number; // Tiền thu hộ (COD)
  MONEY_TOTALFEE?: number; // Tổng cước phí
  MONEY_FEECOD?: number; // Phí thu hộ
  MONEY_FEEVAS?: number; // Phí dịch vụ gia tăng
  MONEY_FEEINSURRANCE?: number; // Phí bảo hiểm
  MONEY_FEE?: number; // Phí vận chuyển
  MONEY_FEEOTHER?: number; // Phí khác
  MONEY_TOTALVAT?: number; // Tổng VAT
  MONEY_TOTAL?: number; // Tổng tiền
  
  LIST_ITEM?: ViettelPostOrderItem[]; // Danh sách sản phẩm chi tiết
}

export interface ViettelPostOrderItem {
  PRODUCT_NAME: string; // Tên sản phẩm
  PRODUCT_PRICE: number; // Giá sản phẩm
  PRODUCT_WEIGHT: number; // Khối lượng
  PRODUCT_QUANTITY: number; // Số lượng
}

// Response từ Viettel Post API
export interface ViettelPostCreateOrderResponse {
  status: number; // 200: thành công
  message: string; // Thông báo
  data: {
    ORDER_NUMBER: string; // Mã đơn hàng shop
    ORDER_CODE?: string; // Mã vận đơn VTP (nếu tạo thành công)
    MONEY_TOTAL?: number; // Tổng tiền
    MONEY_TOTALFEE?: number; // Tổng cước phí
    EXCHANGE_WEIGHT?: number; // Khối lượng quy đổi
  };
  error?: string; // Lỗi (nếu có)
}

// DTO để lấy token
export interface ViettelPostLoginDto {
  USERNAME: string;
  PASSWORD: string;
}

export interface ViettelPostLoginResponse {
  status: number;
  message: string;
  data: {
    token: string;
    userId: number;
    phone: string;
    postOffice: string;
  };
}

// DTO để tính phí vận chuyển
export interface ViettelPostCalculateFeeDto {
  PRODUCT_WEIGHT: number; // Khối lượng (gram)
  PRODUCT_PRICE: number; // Giá trị hàng hóa
  MONEY_COLLECTION?: number; // Tiền thu hộ
  ORDER_SERVICE_ADD?: string; // Dịch vụ cộng thêm
  ORDER_SERVICE: string; // Loại dịch vụ
  SENDER_PROVINCE: number; // Tỉnh người gửi
  SENDER_DISTRICT: number; // Quận người gửi
  RECEIVER_PROVINCE: number; // Tỉnh người nhận
  RECEIVER_DISTRICT: number; // Quận người nhận
  PRODUCT_TYPE: string; // Loại hàng hóa
  NATIONAL_TYPE?: number; // 1: Nội tỉnh, 2: Nội vùng, 3: Liên vùng
}

export interface ViettelPostCalculateFeeResponse {
  status: number;
  message: string;
  data: {
    MONEY_TOTAL: number; // Tổng tiền
    MONEY_TOTALFEE: number; // Tổng cước phí
    MONEY_FEE: number; // Phí vận chuyển
    MONEY_FEECOD: number; // Phí thu hộ
    MONEY_FEEVAS: number; // Phí dịch vụ gia tăng
    MONEY_FEEINSURRANCE: number; // Phí bảo hiểm
    MONEY_FEEOTHER: number; // Phí khác
    MONEY_TOTALVAT: number; // Tổng VAT
    EXCHANGE_WEIGHT: number; // Khối lượng quy đổi
  };
}

// Mapping địa chỉ từ hệ thống sang Viettel Post
export interface AddressMapping {
  city: string; // Tên thành phố/tỉnh
  district?: string; // Tên quận/huyện
  ward?: string; // Tên phường/xã
  provinceId?: number; // Mã tỉnh VTP
  districtId?: number; // Mã quận VTP
  wardId?: number; // Mã phường VTP
}

