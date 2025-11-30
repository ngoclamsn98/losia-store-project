import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ViettelPostService } from './viettel-post.service';
import { PROVINCE_MAPPING } from './helpers/address-mapper';

@ApiTags('viettel-post')
@Controller('viettel-post')
export class ViettelPostController {
  constructor(private readonly viettelPostService: ViettelPostService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Lấy danh sách tỉnh/thành phố' })
  getProvinces() {
    // Chuyển đổi PROVINCE_MAPPING thành array và sort theo tên
    const provinces = Object.entries(PROVINCE_MAPPING).map(([name, id]) => ({
      id,
      name,
    })).sort((a, b) => a.name.localeCompare(b.name, 'vi'));

    return {
      success: true,
      data: provinces,
    };
  }

  @Get('districts')
  @ApiOperation({ summary: 'Lấy danh sách quận/huyện theo tỉnh' })
  @ApiQuery({ name: 'provinceId', required: true, type: Number })
  async getDistricts(@Query('provinceId') provinceId: number) {
    try {
      const districts = await this.viettelPostService.getDistricts(provinceId);
      return {
        success: true,
        data: districts,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }

  @Get('wards')
  @ApiOperation({ summary: 'Lấy danh sách phường/xã theo quận/huyện' })
  @ApiQuery({ name: 'districtId', required: true, type: Number })
  async getWards(@Query('districtId') districtId: number) {
    try {
      const wards = await this.viettelPostService.getWards(districtId);
      return {
        success: true,
        data: wards,
      };
    } catch (error) {
      return {
        success: false,
        message: error.message,
        data: [],
      };
    }
  }
}

