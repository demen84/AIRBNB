import { BadRequestException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { Prisma } from '../../modules-system/prisma/generated/prisma/client';
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
      totalItem: totalItem, 
      totalPage: totalPage, // SL trang
      items: users || [],
    };
  }

  async update(id: number, updateNguoidungDto: UpdateNguoidungDto, currentUserId: Number) {
    try {
      // 1. Kiểm tra xem user có tồn tại không
      const userExists = await this.prisma.nguoidung.findUnique({
        where: { id },
        select: {
          id: true,
          status: true,
          role: true,
        }
      });

      if (!userExists) {
        throw new NotFoundException('Người dùng không tồn tại');
      }

      // 2. Chỉ cho phép tự update chính mình
      if (userExists.id != currentUserId) {
        throw new ForbiddenException('Bạn chỉ có thể cập nhật thông tin của chính mình');
      }

      // 3. Nếu user bị banned thì không cho update profile (trừ trường hợp admin)
      if (userExists.status === nguoidung_status.banned) {
        throw new ForbiddenException('Tài khoản đã bị khóa nên không thể cập nhật thông tin.');
      }

      // 4. Explicit data update - chỉ cho phép các field an toàn
      //    Điều này ngăn chặn hoàn toàn việc update role/status/email/pass_word/banned_at...
      const updateData: any = {
        updated_at: new Date(),
      };

      if (updateNguoidungDto.name !== undefined) {
        updateData.name = updateNguoidungDto.name.trim();
      }
      if (updateNguoidungDto.phone !== undefined) {
        const phone = updateNguoidungDto.phone.trim();
        // Kiểm tra thêm số phone có hợp lệ
        if (!/^0[1-9]\d{8,9}$/.test(phone)) {
          throw new BadRequestException('Số điện thoại không hợp lệ.');
        }

        // Kiểm tra phone đã tồn tại ở user khác chưa
        // ! Nếu ở db đã có unique cho cột phoen thì không cần đoạn code sau:
        // const existingUserWithPhone = await this.prisma.nguoidung.findFirst({
        //   where: {
        //     phone: phone,
        //     id: { not: id }, // Loại trừ chính user đang update
        //   },
        // });

        // if (existingUserWithPhone) {
        //   throw new BadRequestException('Số điện thoại này đã được sử dụng bởi người dùng khác');
        // }

        updateData.phone = phone;
      }
      if (updateNguoidungDto.birth_day !== undefined) {
        const birthDayStr = updateNguoidungDto.birth_day;

        // Validate định dạng YYYY-MM-DD
        // const regDate: string = "/^\d{4}-\d{2}-\d{2}$/";
        if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDayStr)) {
          throw new BadRequestException('Ngày sinh phải có định dạng YYYY-MM-DD');
        }

        const birthDate = new Date(birthDayStr);

        if (isNaN(birthDate.getTime())) {
          throw new BadRequestException('Ngày sinh không hợp lệ');
        }

        // Không cho ngày sinh ở tương lai
        const today = new Date();
        if (birthDate > today) {
          throw new BadRequestException('Ngày sinh không được ở tương lai');
        }

        // Kiểm tra tuổi >= 13
        const age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        const dayDiff = today.getDate() - birthDate.getDate();

        let adjustedAge = age;
        if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
          adjustedAge--;
        }

        if (adjustedAge < 13) {
          throw new BadRequestException('Bạn phải từ 13 tuổi trở lên để sử dụng dịch vụ');
        }

        updateData.birth_day = birthDayStr;
      }
      if (updateNguoidungDto.gender !== undefined) {
        updateData.gender = updateNguoidungDto.gender.trim();
      }
      if (updateNguoidungDto.avatar !== undefined) {
        // // Basic sanitize URL
        // if (!updateNguoidungDto.avatar.startsWith('http')) {
        //   throw new BadRequestException('Avatar phải là URL hợp lệ');
        // } // ==> Xử lý sau
        updateData.avatar = updateNguoidungDto.avatar.trim();
      }

      // Nếu không có field nào để update
      if (Object.keys(updateData).length === 1) { // chỉ có updated_at
        throw new BadRequestException('Không có thông tin nào để cập nhật');
      }

      // Cập nhật (chỉ các trường được gửi lên)
      const updatedUser = await this.prisma.nguoidung.update({
        where: { id },
        data: updateData,
        // data: {
        //   ...updateNguoidungDto,
        //   updated_at: new Date(),
        //   // Không cho phép update role qua route này
        //   // Không cho phép update email nếu bạn muốn giữ unique nghiêm ngặt
        // },
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
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }

      // Optional: Xử lý lỗi Prisma unique violation (nếu sau này thêm @unique cho phone trong schema)
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          throw new BadRequestException('Số điện thoại này đã được sử dụng');
        }
      }

      throw new InternalServerErrorException('Lỗi hệ thống khi cập nhật');
    }
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
      throw new InternalServerErrorException('500 - Lỗi hệ thống');
    }
  }
}
