import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface FlightReimbursementParams {
  atlas_order_no: string;
  pnr: string;
  flight: {
    airline: string;
    flight_number: string;
    origin: string;
    destination: string;
    departure_time: string;
    arrival_time: string;
    passenger: {
      name: string;
      passport: string;
    };
  };
  payment: {
    amount: number;
    currency: string;
    tx_hash?: string;
    method: string;
  };
  attachments?: Array<{
    type: string;
    url: string;
  }>;
}

export class ReimbursementClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.reimbursement.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.reimbursement.apiKey}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 创建航班报销单
   */
  async createFlightReimbursement(params: FlightReimbursementParams): Promise<{
    reimbursement_id: string;
    itinerary_url: string;
    status: string;
  }> {
    try {
      const response = await this.client.post('/reimbursements/flights', params);

      return response.data.data;
    } catch (error: any) {
      console.error('Reimbursement create error:', error.response?.data || error.message);
      throw new Error('Failed to create reimbursement');
    }
  }

  /**
   * 获取报销单详情
   */
  async getReimbursement(id: string) {
    try {
      const response = await this.client.get(`/reimbursements/${id}`);
      return response.data.data;
    } catch (error: any) {
      console.error('Reimbursement get error:', error.response?.data || error.message);
      throw new Error('Failed to get reimbursement');
    }
  }
}

export const reimbursementClient = new ReimbursementClient();
