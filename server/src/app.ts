import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import morgan from 'morgan';
import { allowedClientOrigins, env } from '@/config/env.js';
import { errorHandler } from '@/middleware/errorHandler.js';
import { notFoundHandler } from '@/middleware/notFoundHandler.js';
import { requireSameOrigin } from '@/middleware/requireSameOrigin.js';
import { apiRouter } from '@/routes/index.js';

const app = express();

app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }
      const normalized = origin.replace(/\/$/, '');
      callback(null, allowedClientOrigins.includes(normalized));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
  }),
);

app.use(requireSameOrigin);

app.use('/api', apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
