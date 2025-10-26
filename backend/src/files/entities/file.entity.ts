import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Generated,
} from 'typeorm';

export enum FileType {
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO',
  DOCUMENT = 'DOCUMENT',
  OTHER = 'OTHER',
}

@Entity('files')
export class File {
  @PrimaryColumn('uuid')
  @Generated('uuid')
  id: string;

  @Column({ name: 'original_name' })
  originalName: string;

  @Column({ name: 'file_name' })
  fileName: string;

  @Column({ name: 'file_url' })
  fileUrl: string;

  @Column({ name: 'public_id' })
  publicId: string; // Cloudinary public_id để xóa file

  @Column({
    type: 'enum',
    enum: FileType,
    default: FileType.IMAGE,
  })
  type: FileType;

  @Column({ name: 'mime_type', nullable: true })
  mimeType: string;

  @Column({ nullable: true })
  size: number; // Size in bytes

  @Column({ nullable: true })
  width: number;

  @Column({ nullable: true })
  height: number;

  @Column({ name: 'uploaded_by', type: 'uuid', nullable: true })
  uploadedBy: string; // User ID

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

