/**
 * Mock Atlas API for local testing (Phase 1)
 * 
 * Usage:
 * 1. Rename this file to atlas.ts (backup the real one)
 * 2. Run the service
 * 3. Test Slack interactions without real Atlas API calls
 */

import { FlightSearchParams, FlightOffer } from './atlas';

export class AtlasClient {
  async search(params: FlightSearchParams): Promise<FlightOffer[]> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log('🧪 Mock Atlas search:', params);

    // Return mock data
    return [
      {
        routingIdentifier: 'MOCK_ROUTING_1',
        airline: 'CA',
        flightNumber: '975',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T10:30:00Z`,
        arrivalTime: `${params.departureDate}T16:45:00Z`,
        duration: 375,
        stops: 0,
        price: 280,
        currency: 'USD',
        cabinClass: 'Economy',
      },
      {
        routingIdentifier: 'MOCK_ROUTING_2',
        airline: 'MU',
        flightNumber: '5387',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T14:20:00Z`,
        arrivalTime: `${params.departureDate}T20:35:00Z`,
        duration: 375,
        stops: 0,
        price: 295,
        currency: 'USD',
        cabinClass: 'Economy',
      },
      {
        routingIdentifier: 'MOCK_ROUTING_3',
        airline: 'SQ',
        flightNumber: '801',
        origin: params.origin,
        destination: params.destination,
        departureTime: `${params.departureDate}T08:00:00Z`,
        arrivalTime: `${params.departureDate}T14:15:00Z`,
        duration: 375,
        stops: 0,
        price: 320,
        currency: 'USD',
        cabinClass: 'Economy',
      },
    ];
  }

  async verify(routingIdentifier: string): Promise<{ sessionId: string; isValid: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300));
    
    console.log('🧪 Mock Atlas verify:', routingIdentifier);

    return {
      sessionId: `MOCK_SESSION_${Date.now()}`,
      isValid: true,
    };
  }

  async createOrder(params: any): Promise<{ orderNo: string }> {
    await new Promise(resolve => setTimeout(resolve, 500));

    const orderNo = `MOCK_ORDER_${Date.now()}`;
    console.log('🧪 Mock Atlas createOrder:', orderNo);

    return { orderNo };
  }

  async pay(orderNo: string): Promise<{ success: boolean }> {
    await new Promise(resolve => setTimeout(resolve, 300));

    console.log('🧪 Mock Atlas pay:', orderNo);

    return { success: true };
  }
}

export const atlasClient = new AtlasClient();
