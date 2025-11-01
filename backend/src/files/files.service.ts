import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { File, FileType } from './entities/file.entity';
import { CloudinaryService } from './cloudinary.service';

@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(File)
    private fileRepository: Repository<File>,
    private cloudinaryService: CloudinaryService,
  ) {}

  async uploadFile(
    file: Express.Multer.File,
    userId?: string,
    folder: string = 'losia_store',
  ): Promise<File> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type - accept all image types
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException(
        'Invalid file type. Only images are allowed',
      );
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size exceeds 5MB limit');
    }

    try {
      // Upload to Cloudinary
      const uploadResult = await this.cloudinaryService.uploadImage(file, folder);

      // Determine file type
      let fileType = FileType.IMAGE;
      if (file.mimetype.startsWith('video/')) {
        fileType = FileType.VIDEO;
      } else if (file.mimetype.startsWith('application/')) {
        fileType = FileType.DOCUMENT;
      }

      // Save to database
      const fileEntity = this.fileRepository.create({
        originalName: file.originalname,
        fileName: uploadResult.original_filename || file.originalname,
        fileUrl: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        type: fileType,
        mimeType: file.mimetype,
        size: file.size,
        width: uploadResult.width,
        height: uploadResult.height,
        uploadedBy: userId,
      });

      return await this.fileRepository.save(fileEntity);
    } catch (error) {
      throw new BadRequestException(`Failed to upload file: ${error.message}`);
    }
  }

  async uploadMultipleFiles(
    files: Express.Multer.File[],
    userId?: string,
    folder: string = 'losia_store',
  ): Promise<File[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map((file) =>
      this.uploadFile(file, userId, folder),
    );

    return await Promise.all(uploadPromises);
  }

  async findAll(userId?: string): Promise<File[]> {
    const query: any = {};
    if (userId) {
      query.uploadedBy = userId;
    }
    return await this.fileRepository.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<File> {
    const file = await this.fileRepository.findOne({ where: { id } });
    if (!file) {
      throw new NotFoundException(`File with ID ${id} not found`);
    }
    return file;
  }

  async remove(id: string): Promise<void> {
    const file = await this.findOne(id);

    try {
      // Delete from Cloudinary
      await this.cloudinaryService.deleteImage(file.publicId);

      // Delete from database
      await this.fileRepository.remove(file);
    } catch (error) {
      throw new BadRequestException(`Failed to delete file: ${error.message}`);
    }
  }

  async removeMultiple(ids: string[]): Promise<void> {
    const files = await this.fileRepository.findByIds(ids);
    
    if (files.length === 0) {
      throw new NotFoundException('No files found with provided IDs');
    }

    try {
      // Delete from Cloudinary
      const publicIds = files.map((file) => file.publicId);
      await this.cloudinaryService.deleteImages(publicIds);

      // Delete from database
      await this.fileRepository.remove(files);
    } catch (error) {
      throw new BadRequestException(`Failed to delete files: ${error.message}`);
    }
  }
}

