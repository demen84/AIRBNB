import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateNguoidungDto } from './dto/create-nguoidung.dto';
import { UpdateNguoidungDto } from './dto/update-nguoidung.dto';
import { PaginationQueryDto } from '../phong/dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import { TokenService } from 'src/modules-system/token/token.service';

@Injectable()
export class NguoidungService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) {}

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

  async update(id: number, updateNguoidungDto: UpdateNguoidungDto) {
    // Kiểm tra xem user có tồn tại không
    const user = await this.prisma.nguoidung.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('Người dùng không tồn tại');
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

  // Liệu có nên làm chức năng xóa người dùng???
  remove(id: number) {
    return `This action removes a #${id} nguoidung`;
  }
}
