import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SendEmailDto {
    @ApiProperty({
        description: 'Email address of the recipient',
        example: 'user@example.com',
    })
    @IsEmail()
    @IsNotEmpty()
    to: string;

    @ApiProperty({
        description: 'Subject of the email',
        example: 'Welcome to Losia',
    })
    @IsString()
    @IsNotEmpty()
    subject: string;

    @ApiProperty({
        description: 'HTML content of the email',
        example: '<h1>Welcome!</h1><p>Thank you for joining us.</p>',
    })
    @IsString()
    @IsNotEmpty()
    html: string;

    @ApiPropertyOptional({
        description: 'Email address of the sender (optional, uses default if not provided)',
        example: 'noreply@losia.com',
    })
    @IsEmail()
    @IsOptional()
    from?: string;
}
