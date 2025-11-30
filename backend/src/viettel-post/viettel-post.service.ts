import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosInstance } from 'axios';
import {
  ViettelPostCreateOrderDto,
  ViettelPostCreateOrderResponse,
  ViettelPostLoginDto,
  ViettelPostLoginResponse,
  ViettelPostCalculateFeeDto,
  ViettelPostCalculateFeeResponse,
} from './dto/create-shipping-order.dto';

@Injectable()
export class ViettelPostService {
  private readonly logger = new Logger(ViettelPostService.name);
  private axiosInstance: AxiosInstance;
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private isTokenFromEnv: boolean = false;

  // Cấu hình từ environment variables
  private readonly apiUrl: string;
  private readonly username: string;
  private readonly password: string;
  private readonly envToken: string;

  constructor() {
    // Sử dụng API của Viettel Post
    this.apiUrl = process.env.VIETTEL_POST_API_URL || 'https://partner.viettelpost.vn/v2';
    this.username = process.env.VIETTEL_POST_USERNAME || '';
    this.password = process.env.VIETTEL_POST_PASSWORD || '';
    this.envToken = process.env.VIETTEL_POST_TOKEN || '';

    // Nếu có token trong env, sử dụng luôn
    if (this.envToken) {
      this.token = this.envToken;
      this.isTokenFromEnv = true;
      // Set expiry xa trong tương lai để không tự động refresh
      this.tokenExpiry = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // 1 năm
      this.logger.log('Using VIETTEL_POST_TOKEN from environment variables');
    }

    this.axiosInstance = axios.create({
      baseURL: this.apiUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Interceptor để tự động thêm token vào header
    this.axiosInstance.interceptors.request.use(
      async (config) => {
        // Kiểm tra và refresh token nếu cần
        await this.ensureValidToken();
        if (this.token) {
          config.headers['Token'] = this.token;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      },
    );

    // Interceptor để xử lý lỗi token hết hạn
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // Nếu lỗi 401 (Unauthorized) và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;

          this.logger.warn('Token expired or invalid, attempting to refresh...');

          // Reset token và login lại
          this.token = null;
          this.tokenExpiry = null;
          this.isTokenFromEnv = false;

          try {
            await this.login();
            // Retry request với token mới
            originalRequest.headers['Token'] = this.token;
            return this.axiosInstance(originalRequest);
          } catch (loginError) {
            return Promise.reject(loginError);
          }
        }

        return Promise.reject(error);
      },
    );
  }

  /**
   * Đảm bảo token còn hiệu lực, nếu không thì login lại
   */
  private async ensureValidToken(): Promise<void> {
    // Nếu token từ env, không cần kiểm tra expiry
    if (this.isTokenFromEnv && this.token) {
      return;
    }

    const now = new Date();
    // Token hết hạn sau 24h, refresh trước 1h
    if (!this.token || !this.tokenExpiry || now >= new Date(this.tokenExpiry.getTime() - 3600000)) {
      await this.login();
    }
  }

  /**
   * Đăng nhập để lấy token
   */
  async login(): Promise<string> {
    try {
      const loginDto: ViettelPostLoginDto = {
        USERNAME: this.username,
        PASSWORD: this.password,
      };

      this.logger.log('Logging in to Viettel Post API...');
      const response = await axios.post<ViettelPostLoginResponse>(
        `${this.apiUrl}/user/Login`,
        loginDto,
      );

      if (response.data.status === 200 && response.data.data?.token) {
        this.token = response.data.data.token;
        // Token có hiệu lực 24h
        this.tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);
        this.logger.log('Successfully logged in to Viettel Post API');
        return this.token;
      } else {
        throw new Error(response.data.message || 'Login failed');
      }
    } catch (error) {
      this.logger.error('Failed to login to Viettel Post API', error);
      throw new HttpException(
        'Failed to authenticate with Viettel Post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tạo vận đơn trên Viettel Post
   */
  async createShippingOrder(
    orderData: ViettelPostCreateOrderDto,
  ): Promise<ViettelPostCreateOrderResponse> {
    try {
      this.logger.log(`Creating shipping order for: ${orderData.ORDER_NUMBER}`);

      const response = await this.axiosInstance.post<ViettelPostCreateOrderResponse>(
        '/order/createOrder',
        orderData,
      );

      if (response.data.status === 200) {
        this.logger.log(
          `Successfully created shipping order. VTP Code: ${response.data.data?.ORDER_CODE}`,
        );
        return response.data;
      } else {
        this.logger.error(`Failed to create shipping order: ${response.data.message}`);
        throw new Error(response.data.message || 'Failed to create shipping order');
      }
    } catch (error) {
      this.logger.error('Error creating shipping order', error);
      throw new HttpException(
        error.message || 'Failed to create shipping order with Viettel Post',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Tính phí vận chuyển
   */
  async calculateShippingFee(
    feeData: ViettelPostCalculateFeeDto,
  ): Promise<ViettelPostCalculateFeeResponse> {
    try {
      this.logger.log('Calculating shipping fee...');

      const response = await this.axiosInstance.post<ViettelPostCalculateFeeResponse>(
        '/order/getPriceAll',
        feeData,
      );

      if (response.data.status === 200) {
        this.logger.log(`Shipping fee calculated: ${response.data.data?.MONEY_TOTAL}`);
        return response.data;
      } else {
        throw new Error(response.data.message || 'Failed to calculate shipping fee');
      }
    } catch (error) {
      this.logger.error('Error calculating shipping fee', error);
      throw new HttpException(
        'Failed to calculate shipping fee',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy danh sách quận/huyện theo tỉnh
   */
  async getDistricts(provinceId: number): Promise<Array<{ id: number; name: string }>> {
    try {
      this.logger.log(`Getting districts for province: ${provinceId}`);

      const response = await this.axiosInstance.get('/categories/listDistrict', {
        params: { provinceId },
      });

      if (response.data.status === 200 && response.data.data) {
        return response.data.data.map((district: any) => ({
          id: district.DISTRICT_ID,
          name: district.DISTRICT_NAME,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to get districts');
      }
    } catch (error) {
      this.logger.error('Error getting districts', error);
      throw new HttpException(
        'Failed to get districts',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Lấy danh sách phường/xã theo quận/huyện
   */
  async getWards(districtId: number): Promise<Array<{ id: number; name: string }>> {
    try {
      this.logger.log(`Getting wards for district: ${districtId}`);

      const response = await this.axiosInstance.get('/categories/listCommune', {
        params: { districtId },
      });

      if (response.data.status === 200 && response.data.data) {
        return response.data.data.map((ward: any) => ({
          id: ward.COMMUNE_ID,
          name: ward.COMMUNE_NAME,
        }));
      } else {
        throw new Error(response.data.message || 'Failed to get wards');
      }
    } catch (error) {
      this.logger.error('Error getting wards', error);
      throw new HttpException(
        'Failed to get wards',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}

