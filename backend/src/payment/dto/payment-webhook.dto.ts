import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';

export class PaymentWebhookDto {
  @ApiPropertyOptional()
  @IsOptional()
  code: string;

  @ApiPropertyOptional()
  @IsOptional()
  desc: string;

  @ApiPropertyOptional()
  @IsOptional()
  challenge: any;

  @ApiPropertyOptional()
  @IsOptional()
  data: {
    orderCode: number;
    amount: number;
    description: string;
    accountNumber: string;
    reference: string;
    transactionDateTime: string;
    currency: string;
    paymentLinkId: string;
    code: string;
    desc: string;
    counterAccountBankId: string;
    counterAccountBankName: string;
    counterAccountName: string;
    counterAccountNumber: string;
    virtualAccountName: string;
    virtualAccountNumber: string;
  };

  @ApiPropertyOptional()
  @IsOptional()
  signature: string;
}

