import axios, { AxiosInstance } from 'axios';
import { config } from '../config';
import QRCode from 'qrcode';

export interface PaymentLink {
  id: string;
  url: string;
  qrCode: string; // base64 data URL
  amount: number;
  currency: string;
  expiresAt: Date;
}

export class FluxaWalletClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://api.fluxapay.xyz', // 假设的API地址
      headers: {
        'Authorization': `Bearer ${config.fluxa.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 创建USDC支付链接
   */
  async createPaymentLink(params: {
    amount: number;
    currency: string;
    description: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentLink> {
    try {
      const response = await this.client.post('/payment-links', {
        amount: params.amount,
        currency: params.currency,
        network: 'base',
        description: params.description,
        metadata: params.metadata,
        expiresInMinutes: 15,
      });

      const data = response.data.data;
      
      // 生成支付地址的二维码
      const paymentAddress = `${config.fluxa.walletAddress}?amount=${params.amount}`;
      const qrCodeDataUrl = await QRCode.toDataURL(paymentAddress, {
        width: 300,
        margin: 2,
      });

      return {
        id: data.id,
        url: data.url,
        qrCode: qrCodeDataUrl,
        amount: params.amount,
        currency: params.currency,
        expiresAt: new Date(data.expiresAt),
      };
    } catch (error: any) {
      console.error('FluxA payment link error:', error.response?.data || error.message);
      throw new Error('Failed to create payment link');
    }
  }

  /**
   * 检查支付状态
   */
  async checkPayment(paymentLinkId: string): Promise<{
    paid: boolean;
    txHash?: string;
    paidAt?: Date;
  }> {
    try {
      const response = await this.client.get(`/payment-links/${paymentLinkId}`);
      const data = response.data.data;

      return {
        paid: data.status === 'paid',
        txHash: data.txHash,
        paidAt: data.paidAt ? new Date(data.paidAt) : undefined,
      };
    } catch (error: any) {
      console.error('FluxA check payment error:', error.response?.data || error.message);
      throw new Error('Failed to check payment status');
    }
  }
}

export const fluxaClient = new FluxaWalletClient();
