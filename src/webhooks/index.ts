import { Express } from 'express';
import express from 'express';
import { handleAtlasWebhook } from './atlas';
import { handleFluxaWebhook } from './fluxa';

export function setupWebhooks(app: Express) {
  app.use(express.json());

  // Atlas票务通知
  app.post('/webhooks/atlas/ticket-issued', handleAtlasWebhook);

  // FluxA支付通知
  app.post('/webhooks/fluxa/payment', handleFluxaWebhook);

  // Health check
  app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });
}
