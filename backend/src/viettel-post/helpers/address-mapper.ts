/**
 * Helper để map địa chỉ từ hệ thống sang mã tỉnh/quận/phường của Viettel Post
 * Dữ liệu này cần được cập nhật từ API của Viettel Post hoặc database
 */

// Mapping tỉnh/thành phố
export const PROVINCE_MAPPING: Record<string, number> = {
  'Hà Nội': 1,
  'Hồ Chí Minh': 2,
  'Đà Nẵng': 48,
  'Hải Phòng': 31,
  'Cần Thơ': 92,
  'An Giang': 89,
  'Bà Rịa - Vũng Tàu': 77,
  'Bắc Giang': 24,
  'Bắc Kạn': 6,
  'Bạc Liêu': 95,
  'Bắc Ninh': 27,
  'Bến Tre': 83,
  'Bình Định': 52,
  'Bình Dương': 74,
  'Bình Phước': 70,
  'Bình Thuận': 60,
  'Cà Mau': 96,
  'Cao Bằng': 4,
  'Đắk Lắk': 66,
  'Đắk Nông': 67,
  'Điện Biên': 11,
  'Đồng Nai': 75,
  'Đồng Tháp': 87,
  'Gia Lai': 64,
  'Hà Giang': 2,
  'Hà Nam': 35,
  'Hà Tĩnh': 42,
  'Hải Dương': 30,
  'Hậu Giang': 93,
  'Hòa Bình': 17,
  'Hưng Yên': 33,
  'Khánh Hòa': 56,
  'Kiên Giang': 91,
  'Kon Tum': 62,
  'Lai Châu': 12,
  'Lâm Đồng': 68,
  'Lạng Sơn': 20,
  'Lào Cai': 10,
  'Long An': 80,
  'Nam Định': 36,
  'Nghệ An': 40,
  'Ninh Bình': 37,
  'Ninh Thuận': 58,
  'Phú Thọ': 25,
  'Phú Yên': 54,
  'Quảng Bình': 44,
  'Quảng Nam': 49,
  'Quảng Ngãi': 51,
  'Quảng Ninh': 22,
  'Quảng Trị': 45,
  'Sóc Trăng': 94,
  'Sơn La': 14,
  'Tây Ninh': 72,
  'Thái Bình': 34,
  'Thái Nguyên': 19,
  'Thanh Hóa': 38,
  'Thừa Thiên Huế': 46,
  'Tiền Giang': 82,
  'Trà Vinh': 84,
  'Tuyên Quang': 8,
  'Vĩnh Long': 86,
  'Vĩnh Phúc': 26,
  'Yên Bái': 15,
};

/**
 * Lấy mã tỉnh từ tên tỉnh
 */
export function getProvinceId(provinceName: string): number | undefined {
  // Chuẩn hóa tên tỉnh (loại bỏ khoảng trắng thừa, viết hoa chữ cái đầu)
  const normalized = provinceName.trim();
  
  // Tìm kiếm chính xác
  if (PROVINCE_MAPPING[normalized]) {
    return PROVINCE_MAPPING[normalized];
  }
  
  // Tìm kiếm gần đúng (case-insensitive)
  const lowerName = normalized.toLowerCase();
  for (const [key, value] of Object.entries(PROVINCE_MAPPING)) {
    if (key.toLowerCase() === lowerName) {
      return value;
    }
  }
  
  // Tìm kiếm một phần (contains)
  for (const [key, value] of Object.entries(PROVINCE_MAPPING)) {
    if (key.toLowerCase().includes(lowerName) || lowerName.includes(key.toLowerCase())) {
      return value;
    }
  }
  
  return undefined;
}

/**
 * Lấy mã quận/huyện từ tên quận và mã tỉnh
 * Note: Cần implement đầy đủ mapping hoặc gọi API Viettel Post để lấy danh sách quận/huyện
 */
export function getDistrictId(districtName: string, provinceId: number): number | undefined {
  // TODO: Implement full district mapping hoặc gọi API Viettel Post
  // Hiện tại return undefined để sử dụng địa chỉ text
  return undefined;
}

/**
 * Lấy mã phường/xã từ tên phường và mã quận
 * Note: Cần implement đầy đủ mapping hoặc gọi API Viettel Post để lấy danh sách phường/xã
 */
export function getWardId(wardName: string, districtId: number): number | undefined {
  // TODO: Implement full ward mapping hoặc gọi API Viettel Post
  // Hiện tại return undefined để sử dụng địa chỉ text
  return undefined;
}

/**
 * Parse địa chỉ đầy đủ thành các thành phần
 * Format: "Số nhà, Đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành phố"
 */
export function parseAddress(fullAddress: string): {
  street: string;
  ward?: string;
  district?: string;
  province?: string;
} {
  const parts = fullAddress.split(',').map(p => p.trim());
  
  if (parts.length >= 4) {
    return {
      street: parts.slice(0, -3).join(', '),
      ward: parts[parts.length - 3],
      district: parts[parts.length - 2],
      province: parts[parts.length - 1],
    };
  } else if (parts.length === 3) {
    return {
      street: parts[0],
      district: parts[1],
      province: parts[2],
    };
  } else if (parts.length === 2) {
    return {
      street: parts[0],
      province: parts[1],
    };
  }
  
  return {
    street: fullAddress,
  };
}

