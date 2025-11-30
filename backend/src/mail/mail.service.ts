import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { SendEmailDto } from './dto/send-email.dto';
import { getWelcomeEmailTemplate } from './templates/welcome.template';
import { getPasswordResetEmailTemplate } from './templates/password-reset.template';
import { getOrderConfirmationEmailTemplate } from './templates/order-confirmation.template';

@Injectable()
export class MailService {
    private resend: Resend;
    private readonly logger = new Logger(MailService.name);
    private readonly fromEmail: string;

    constructor(private configService: ConfigService) {
        const apiKey = this.configService.get<string>('RESEND_API_KEY');
        if (!apiKey) {
            this.logger.warn('RESEND_API_KEY is not configured. Email sending will fail.');
        }
        this.resend = new Resend(apiKey);
        this.fromEmail = this.configService.get<string>('RESEND_FROM_EMAIL') || 'noreply@losia.com';
    }

    /**
     * Send a generic email
     */
    async sendEmail(sendEmailDto: SendEmailDto): Promise<any> {
        try {
            const { to, subject, html, from } = sendEmailDto;

            const result = await this.resend.emails.send({
                from: from || this.fromEmail,
                to,
                subject,
                html,
            });

            this.logger.log(`Email sent successfully to ${to}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to send email: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Send welcome email to new users
     */
    async sendWelcomeEmail(to: string, name: string): Promise<any> {
        try {
            const html = getWelcomeEmailTemplate(name);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: 'Chào mừng đến với Losia! 🌱',
                html,
            });

            this.logger.log(`Welcome email sent to ${to}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to send welcome email to ${to}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Send password reset email
     */
    async sendPasswordResetEmail(to: string, resetToken: string): Promise<any> {
        try {
            const html = getPasswordResetEmailTemplate(resetToken);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: 'Đặt lại mật khẩu - Losia',
                html,
            });

            this.logger.log(`Password reset email sent to ${to}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to send password reset email to ${to}: ${error.message}`, error.stack);
            throw error;
        }
    }

    /**
     * Send order confirmation email
     */
    async sendOrderConfirmationEmail(to: string, orderDetails: any): Promise<any> {
        try {
            const html = getOrderConfirmationEmailTemplate(orderDetails);

            const result = await this.resend.emails.send({
                from: this.fromEmail,
                to,
                subject: `Xác nhận đơn hàng #${orderDetails.orderNumber} - Losia`,
                html,
            });

            this.logger.log(`Order confirmation email sent to ${to} for order #${orderDetails.orderNumber}`);
            return result;
        } catch (error) {
            this.logger.error(`Failed to send order confirmation email to ${to}: ${error.message}`, error.stack);
            throw error;
        }
    }
}
