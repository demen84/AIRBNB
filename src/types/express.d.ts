import { Nguoidung } from '@prisma/client'; // Cách tốt nhất nếu dùng Prisma

declare global {
  namespace Express {
    interface Request {
      user?: Nguoidung;
    }
  }
}

export {};
