import 'dotenv/config';
import { createApp } from './app.ts';

if (!process.env.DEEPSEEK_API_KEY) {
  console.error('✗ DEEPSEEK_API_KEY is not set. Create backend/.env from .env.example.');
  process.exit(1);
}

const app = createApp();
const PORT = Number(process.env.PORT ?? 3001);
app.listen(PORT, () => {
  console.log(`✓ Cockpit Agent backend  →  http://localhost:${PORT}`);
});
