import { config as loadDotenv } from 'dotenv';

loadDotenv();

if (!process.env.CLIENT_URL || !URL.canParse(process.env.CLIENT_URL)) {
  process.env.CLIENT_URL = 'http://localhost:5173';
}
