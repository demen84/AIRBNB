import { ArgumentsHost, Catch, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '../../modules-system/prisma/generated/prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
    catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const message = exception.message.replace(/\n/g, '');

        switch (exception.code) {
            case 'P2002': {
                // Lỗi trùng lặp dữ liệu (Unique constraint)
                const status = HttpStatus.CONFLICT;
                response.status(status).json({
                    statusCode: status,
                    message: `Dữ liệu bị trùng lặp: ${exception.meta?.target}`,
                    error: 'Conflict',
                });
                break;
            }
            case 'P2025': {
                // Lỗi không tìm thấy bản ghi để update/delete
                const status = HttpStatus.NOT_FOUND;
                response.status(status).json({
                    statusCode: status,
                    message: 'Không tìm thấy bản ghi yêu cầu hoặc ID không tồn tại',
                    error: 'Not Found',
                });
                break;
            }
            case 'P2003': {
                // Lỗi vi phạm khóa ngoại (Foreign key constraint)
                const status = HttpStatus.BAD_REQUEST;
                response.status(status).json({
                    statusCode: status,
                    message: 'Dữ liệu đang được sử dụng ở bảng khác, không thể xóa hoặc cập nhật',
                    error: 'Foreign Key Constraint',
                });
                break;
            }
            default:
                // Các lỗi Prisma khác chưa được xử lý cụ thể
                super.catch(exception, host);
                break;
        }
    }
}