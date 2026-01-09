import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CreateDatphongDto } from './dto/create-datphong.dto';
import { UpdateDatphongDto } from './dto/update-datphong.dto';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
// import { TokenService } from 'src/modules-system/token/token.service';
import { datphong_trang_thai } from 'src/modules-system/prisma/generated/prisma/enums';
import { AuthUser } from 'src/common/interface/auth-user.interface';

@Injectable()
export class DatphongService {
  constructor(
    private readonly prisma: PrismaService,
    // private readonly tokenService: TokenService,
  ) { }

  async create(createDatphongDto: CreateDatphongDto, currentUser: AuthUser) {
    // 0. Lấy data từ dto
    const { ma_phong, ngay_den, ngay_di, so_luong_khach } = createDatphongDto;

    // 1. Kiểm tra ngày đi > ngày đến
    const checkIn = new Date(ngay_den);
    const checkOut = new Date(ngay_di);

    if (checkOut <= checkIn) {
      throw new BadRequestException('Ngày đi phải lớn hơn ngày đến');
    }

    // 2. Check phòng có tồn tại không?
    const phong = await this.prisma.phong.findUnique({
      where: { id: ma_phong },
      select: { id: true, khach: true }
    });

    if (!phong) {
      throw new NotFoundException('Không có phòng này');
    }

    // 3. Check số lượng khách không được vượt quá quy định của phòng
    if (so_luong_khach > phong.khach) {
      throw new BadRequestException(`Số lượng khách vượt quá sức chứa của phòng (tối đa ${phong.khach})`);
    }

    // 4. ✅ Check phòng bị được đặt trùng ngày
    const conflictBooking = await this.prisma.datphong.findFirst({
      where: {
        ma_phong,
        trang_thai: {
          in: [datphong_trang_thai.pending, datphong_trang_thai.confirmed]
        },
        NOT: [
          { ngay_di: { lte: checkIn } },
          { ngay_den: { gte: checkOut } }
        ]
      }
    });

    if (conflictBooking) {
      throw new BadRequestException('Phòng đã được đặt trong khoảng thời gian này');
    }

    // 5. Đặt/tạo phòng
    const booking = await this.prisma.datphong.create({
      data: {
        ma_phong,
        ngay_den: checkIn,
        ngay_di: checkOut,
        so_luong_khach,
        ma_nguoi_dat: currentUser.id,
        trang_thai: datphong_trang_thai.pending,
      }
    });

    return {
      message: 'Đặt phòng thành công!',
      data: booking
    };
  }

  findAll() {
    return `This action returns all datphong`;
  }

  findOne(id: number) {
    return `This action returns a #${id} datphong`;
  }

  update(id: number, updateDatphongDto: UpdateDatphongDto) {
    return `This action updates a #${id} datphong`;
  }

  remove(id: number) {
    return `This action removes a #${id} datphong`;
  }
}
