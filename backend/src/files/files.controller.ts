import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  Query,
  Body,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import { FilesService } from './files.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UploadResponseDto } from './dto/upload-response.dto';

@ApiTags('files')
@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FileInterceptor('file'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a single file to Cloudinary' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        folder: {
          type: 'string',
          example: 'losia_store/products',
          description: 'Cloudinary folder path (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'File uploaded successfully',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req,
    @Body('folder') folder?: string,
  ) {
    const userId = req.user?.id;
    return await this.filesService.uploadFile(
      file,
      userId,
      folder || 'losia_store',
    );
  }

  @Post('upload-multiple')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload multiple files to Cloudinary (max 10)' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        files: {
          type: 'array',
          items: {
            type: 'string',
            format: 'binary',
          },
        },
        folder: {
          type: 'string',
          example: 'losia_store/products',
          description: 'Cloudinary folder path (optional)',
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Files uploaded successfully',
    type: [UploadResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid files' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req,
    @Body('folder') folder?: string,
  ) {
    const userId = req.user?.id;
    return await this.filesService.uploadMultipleFiles(
      files,
      userId,
      folder || 'losia_store',
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get all uploaded files' })
  @ApiResponse({
    status: 200,
    description: 'List of files',
    type: [UploadResponseDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query('userId') userId?: string) {
    return await this.filesService.findAll(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({ summary: 'Get file by ID' })
  @ApiResponse({
    status: 200,
    description: 'File details',
    type: UploadResponseDto,
  })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findOne(@Param('id') id: string) {
    return await this.filesService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete file by ID',
    description: 'Deletes file from both Cloudinary and database',
  })
  @ApiResponse({ status: 200, description: 'File deleted successfully' })
  @ApiResponse({ status: 404, description: 'File not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async remove(@Param('id') id: string) {
    await this.filesService.remove(id);
    return { message: 'File deleted successfully' };
  }

  @Delete('batch/delete')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete multiple files',
    description: 'Deletes multiple files from both Cloudinary and database',
  })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        ids: {
          type: 'array',
          items: { type: 'string' },
          example: ['123e4567-e89b-12d3-a456-426614174000', '123e4567-e89b-12d3-a456-426614174001'],
        },
      },
    },
  })
  @ApiResponse({ status: 200, description: 'Files deleted successfully' })
  @ApiResponse({ status: 404, description: 'Files not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async removeMultiple(@Body('ids') ids: string[]) {
    await this.filesService.removeMultiple(ids);
    return { message: 'Files deleted successfully' };
  }
}

