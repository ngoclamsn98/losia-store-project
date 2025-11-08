import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CommonService, OptionResponse } from './common.service';

@ApiTags('Common')
@Controller('common')
export class CommonController {
  constructor(private readonly commonService: CommonService) {}

  @Get('options')
  @ApiOperation({ 
    summary: 'Get options from database tables',
    description: 'Retrieve options from specified tables. Supports: eco_impacts, product_conditions, categories, product_seasons'
  })
  @ApiQuery({ 
    name: 'table', 
    required: true, 
    description: 'Table name to fetch options from',
    example: 'eco_impacts'
  })
  @ApiQuery({ 
    name: 'labelField', 
    required: false, 
    description: 'Field to use as label (default: auto-detected)',
    example: 'productGroup'
  })
  @ApiQuery({ 
    name: 'valueField', 
    required: false, 
    description: 'Field to use as value (default: id)',
    example: 'id'
  })
  async getOptions(
    @Query('table') table: string,
    @Query('labelField') labelField?: string,
    @Query('valueField') valueField?: string,
  ): Promise<OptionResponse[]> {
    if (!table) {
      throw new BadRequestException('Table parameter is required');
    }

    return this.commonService.getOptions(table, labelField, valueField);
  }

  @Get('enums')
  @ApiOperation({ 
    summary: 'Get enum values',
    description: 'Retrieve enum values. Supports: product_status, product_season, user_role, gender'
  })
  @ApiQuery({ 
    name: 'enum', 
    required: true, 
    description: 'Enum name to fetch values from',
    example: 'product_season'
  })
  async getEnums(@Query('enum') enumName: string): Promise<OptionResponse[]> {
    if (!enumName) {
      throw new BadRequestException('Enum parameter is required');
    }

    return this.commonService.getEnums(enumName);
  }
}

