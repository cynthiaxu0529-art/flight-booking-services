import axios, { AxiosInstance } from 'axios';
import { config } from '../config';

export interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  adults?: number;
  children?: number;
  infants?: number;
}

export interface FlightOffer {
  routingIdentifier: string;
  airline: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number;
  stops: number;
  price: number;
  currency: string;
  cabinClass: string;
}

export class AtlasClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: config.atlas.apiUrl,
      headers: {
        'x-atlas-client-id': config.atlas.clientId,
        'x-atlas-client-secret': config.atlas.clientSecret,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 搜索航班
   */
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    try {
      const response = await this.client.post('/search', {
        tripType: 'OneWay',
        fromCity: params.origin,
        toCity: params.destination,
        fromDate: params.departureDate,
        adultNumber: params.adults || 1,
        childNumber: params.children || 0,
        infantNumber: params.infants || 0,
      });

      // 解析Atlas返回的航班数据
      const routings = response.data.data?.routings || [];
      
      return routings.slice(0, 5).map((routing: any) => {
        const segment = routing.fromSegments?.[0];
        return {
          routingIdentifier: routing.routingIdentifier,
          airline: segment?.airlineCode || 'N/A',
          flightNumber: segment?.flightNumber || 'N/A',
          origin: params.origin,
          destination: params.destination,
          departureTime: segment?.departureDateTime || '',
          arrivalTime: segment?.arrivalDateTime || '',
          duration: segment?.flightTime || 0,
          stops: routing.fromSegments?.length - 1 || 0,
          price: routing.adultPrice || 0,
          currency: routing.currency || 'USD',
          cabinClass: segment?.cabinClass || 'Economy',
        };
      });
    } catch (error: any) {
      console.error('Atlas search error:', error.response?.data || error.message);
      throw new Error('Failed to search flights');
    }
  }

  /**
   * 验证价格
   */
  async verify(routingIdentifier: string): Promise<{ sessionId: string; isValid: boolean }> {
    try {
      const response = await this.client.post('/verify', {
        routingIdentifier,
      });

      return {
        sessionId: response.data.data?.sessionId || '',
        isValid: response.data.success === true,
      };
    } catch (error: any) {
      console.error('Atlas verify error:', error.response?.data || error.message);
      throw new Error('Failed to verify flight price');
    }
  }

  /**
   * 创建订单
   */
  async createOrder(params: {
    sessionId: string;
    passenger: {
      firstName: string;
      lastName: string;
      gender: 'M' | 'F';
      birthDate: string;
      nationality: string;
      passportNumber: string;
      passportExpiry: string;
    };
    contact: {
      email: string;
      phone: string;
    };
  }): Promise<{ orderNo: string }> {
    try {
      const response = await this.client.post('/order', {
        sessionId: params.sessionId,
        passengers: [
          {
            name: `${params.passenger.firstName}/${params.passenger.lastName}`,
            passengerType: 1, // Adult
            gender: params.passenger.gender === 'M' ? 0 : 1,
            birthday: params.passenger.birthDate,
            nationality: params.passenger.nationality,
            cardNum: params.passenger.passportNumber,
            cardExpired: params.passenger.passportExpiry,
            cardIssuePlace: params.passenger.nationality,
          },
        ],
        contact: {
          name: `${params.passenger.firstName} ${params.passenger.lastName}`,
          email: params.contact.email,
          mobile: params.contact.phone,
        },
      });

      return {
        orderNo: response.data.data?.orderNo || '',
      };
    } catch (error: any) {
      console.error('Atlas order error:', error.response?.data || error.message);
      throw new Error('Failed to create order');
    }
  }

  /**
   * 支付订单
   */
  async pay(orderNo: string): Promise<{ success: boolean }> {
    try {
      // 使用Atlas账户余额支付 (deposit模式)
      const response = await this.client.post('/pay', {
        orderNo,
        paymentMethod: 'deposit',
      });

      return {
        success: response.data.success === true,
      };
    } catch (error: any) {
      console.error('Atlas pay error:', error.response?.data || error.message);
      throw new Error('Failed to pay order');
    }
  }
}

export const atlasClient = new AtlasClient();
