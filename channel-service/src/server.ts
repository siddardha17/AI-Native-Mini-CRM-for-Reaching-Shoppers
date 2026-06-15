import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';

const app = express();
app.use(cors());
app.use(bodyParser.json());

const PORT = 4000;
const CRM_WEBHOOK_URL = 'http://localhost:3000/api/webhooks/receipts';

app.post('/send', (req, res) => {
  const { campaignId, communications } = req.body;

  if (!communications || !Array.isArray(communications)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  // Acknowledge receipt immediately
  res.status(202).json({ message: 'Communications accepted for delivery', count: communications.length });

  // Process asynchronously
  communications.forEach(comm => {
    simulateDeliveryLifecycle(comm);
  });
});

function simulateDeliveryLifecycle(comm: any) {
  const externalId = `ext_${Math.random().toString(36).substr(2, 9)}`;

  // 1. Simulate SENT status after 1-3 seconds
  setTimeout(() => {
    sendWebhook(comm.id, 'SENT', externalId);

    // 2. Simulate DELIVERED or FAILED after another 2-5 seconds
    setTimeout(() => {
      const isFailure = Math.random() < 0.1; // 10% failure rate
      const status = isFailure ? 'FAILED' : 'DELIVERED';
      sendWebhook(comm.id, status, externalId);

      // 3. If delivered, simulate OPENED after 3-10 seconds
      if (!isFailure) {
        setTimeout(() => {
          const isOpened = Math.random() < 0.6; // 60% open rate
          if (isOpened) {
            sendWebhook(comm.id, 'OPENED', externalId);
          }
        }, Math.random() * 7000 + 3000);
      }
    }, Math.random() * 3000 + 2000);

  }, Math.random() * 2000 + 1000);
}

async function sendWebhook(communicationId: string, status: string, externalId: string) {
  try {
    const response = await fetch(CRM_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ communicationId, status, externalId })
    });
    if (!response.ok) {
      console.error(`Webhook failed for ${communicationId} with status ${response.status}`);
    } else {
      console.log(`Webhook sent: ${communicationId} is now ${status}`);
    }
  } catch (error) {
    console.error(`Webhook network error for ${communicationId}:`, error);
  }
}

app.listen(PORT, () => {
  console.log(`Mock Channel Service running on http://localhost:${PORT}`);
});
