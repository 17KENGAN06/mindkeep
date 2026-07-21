type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, message: string, meta?: unknown): void {
  const entry = {
    level,
    message,
    time: new Date().toISOString(),
    ...(meta !== undefined ? { meta } : {}),
  };

  if (level === 'error') {
    console.error(JSON.stringify(entry));
    return;
  }

  if (level === 'warn') {
    console.warn(JSON.stringify(entry));
    return;
  }

  console.info(JSON.stringify(entry));
}

export const logger = {
  info: (message: string, meta?: unknown) => log('info', message, meta),
  warn: (message: string, meta?: unknown) => log('warn', message, meta),
  error: (message: string, meta?: unknown) => log('error', message, meta),
  debug: (message: string, meta?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      log('debug', message, meta);
    }
  },
};
