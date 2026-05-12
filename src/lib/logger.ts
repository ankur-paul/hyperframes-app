type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, context: string, message: string, data?: unknown) {
  const timestamp = new Date().toISOString();
  const base = `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}`;
  if (data) {
    let dataStr = '';
    try {
      dataStr = typeof data === 'object' ? JSON.stringify(data) : String(data);
    } catch {
      dataStr = '[Circular/Unserializable Data]';
    }
    return `${base} | ${dataStr}`;
  }
  return base;
}

export const logger = {
  info: (context: string, message: string, data?: unknown) => {
    console.log(formatMessage('info', context, message, data));
  },
  warn: (context: string, message: string, data?: unknown) => {
    console.warn(formatMessage('warn', context, message, data));
  },
  error: (context: string, message: string, data?: unknown) => {
    console.error(formatMessage('error', context, message, data));
  },
  debug: (context: string, message: string, data?: unknown) => {
    if (process.env.NODE_ENV !== 'production') {
      console.debug(formatMessage('debug', context, message, data));
    }
  },
};
