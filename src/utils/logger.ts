const IS_DEV = process.env.NODE_ENV === 'development';

export const logger = {
  info: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.log(`[INFO] ${message}`, ...args);
    }
  },
  warn: (message: string, ...args: any[]) => {
    if (IS_DEV) {
      console.warn(`[WARN] ${message}`, ...args);
    }
  },
  error: (message: string, error?: any, ...args: any[]) => {
    // Errors should be reported or logged even in production (typically to an error tracking service)
    console.error(`[ERROR] ${message}`, error, ...args);
  },
  // OTP is critical and must be printed in the server console regardless of the environment
  otp: (message: string, ...args: any[]) => {
    console.log(`[OTP] ${message}`, ...args);
  }
};
