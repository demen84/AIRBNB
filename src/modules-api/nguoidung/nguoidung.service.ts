import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
// import { CreateNguoidungDto } from './dto/create-nguoidung.dto';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import { TokenService } from 'src/modules-system/token/token.service';
import { nguoidung_status } from 'src/modules-system/prisma/generated/prisma/enums';

@Injectable()
export class NguoidungService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

  async findAll(queryDto: PaginationQueryDto) {
    const { page, pageSize, filters, skip } = buildQuery(queryDto);

    const usersPromise = this.prisma.nguoidung.findMany({
      where: filters,
      skip: skip, // skip qua index bao nhiêu phần tử
      take: pageSize, // số phần tử cần lấy

      // Chỉ show các field cần thiết
      select: {
        id: true,
        email: true,
        name: true,
        gender: true,
        phone: true,
        avatar: true,
        role: true,
        created_at: true,
      },
      orderBy: [{ created_at: 'asc' }, { id: 'desc' }],
    });

    const totalItemPromise = this.prisma.nguoidung.count({ where: filters });

    // Truy vấn xuống db nên phải dùng await
    const [users, totalItem] = await Promise.all([
      usersPromise,
      totalItemPromise,
    ]); // vì user & totalItem chạy độc lập, nên ta cho nó chạy song song, bằng cách bỏ vào Promise.all() này. Ở trên ta bỏ await

    const totalPage = Math.ceil(totalItem / pageSize);

    return {
      thongBao: 'Lấy danh sách Người dùng thành công',
      page: page,
      pageSize: pageSize,
      totalItem: totalItem, // SL bài viết
      totalPage: totalPage, // SL trang
      items: users || [],
    };
  }

  async update(id: number, updateNguoidungDto: UpdateNguoidungDto, currentUserId: Number) {
    // Kiểm tra xem user có tồn tại không
    const userExists = await this.prisma.nguoidung.findUnique({
      where: { id },
    });

    if (!userExists) {
      throw new NotFoundException('Người dùng không tồn tại');
    }

    if (userExists.id != currentUserId) {
      throw new ForbiddenException('Bạn chỉ có thể cập nhật thông tin của chính mình');
    }

    // Cập nhật (chỉ các trường được gửi lên)
    const updatedUser = await this.prisma.nguoidung.update({
      where: { id },
      data: {
        ...updateNguoidungDto,
        updated_at: new Date(),
        // Không cho phép update role qua route này
        // Không cho phép update email nếu bạn muốn giữ unique nghiêm ngặt
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        birth_day: true,
        gender: true,
        avatar: true,
        role: true,
        created_at: true,
        updated_at: true,
      },
    });

    return {
      message: 'Cập nhật thông tin người dùng thành công',
      data: updatedUser,
    };
  }

  // Chỉ có admin mới có quyền xóa người dùng
  // Chỉ là soft delete chứ không hard delete
  async banUser(id: number, currentUser: { id: number; role: string }) {
    try {
      // 0. Kiểm tra quyền admin mới cho xóa
      if (currentUser.role !== 'admin') {
        throw new ForbiddenException('Bạn không có quyền thực hiện hành động này');
      }
      // 1. Kiểm tra user không thể tự banned chính mình
      if (id === currentUser.id) {
        throw new BadRequestException('Bạn không thể tự khóa tài khoản của chính mình');
      }
      // 2. Tìm user cần banned
      const userToBan = await this.prisma.nguoidung.findUnique({
        where: { id }
      });

      // Kiểm tra user có tồn tại không?
      if (!userToBan) {
        throw new NotFoundException(`Người dùng ${id} không tồn tại`);
      }

      // 3. Admin không thể banned tài khoản khác cũng có role là 'admin'
      if (userToBan.role === 'admin') {
        throw new BadRequestException('Không thể khóa tài khoản của một Admin khác');
      }

      // 4. User đã bị banned rồi thì không banned nữa (để tránh ghi đè ngày banned_at mới)
      if (userToBan.status === nguoidung_status.banned) {
        throw new BadRequestException('Người dùng này đã bị khóa từ trước đó rồi');
      }

      // 5. Cập nhật status = 'banned' or 'pending'
      const bannedUser = await this.prisma.nguoidung.update({
        where: { id },
        data: {
          status: nguoidung_status.banned,
          banned_at: new Date(),
          updated_at: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          updated_at: true
        },
      });

      return {
        message: "Khóa người dùng thành công.",
        data: bannedUser
      };

    } catch (error) {
      // Quan trọng: Đẩy các lỗi có chủ đích ra ngoài để NestJS trả đúng mã code (403, 404)
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) { throw error; }

      // Lỗi server
      throw new InternalServerErrorException('Có lỗi xảy ra khi thực hiện khóa người dùng');
    }
  }
}
