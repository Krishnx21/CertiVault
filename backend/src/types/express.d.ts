import 'express';

declare module 'express' {
  interface Request {
    file?: {
      buffer: Buffer;
      originalname: string;
      mimetype: string;
      size: number;
      fieldname: string;
      encoding: string;
    };
  }
}
