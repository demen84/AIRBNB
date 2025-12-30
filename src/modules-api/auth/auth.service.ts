import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from 'src/modules-system/token/token.service';
import { QueryDto } from '../phong/dto/query.dto';
import { buildQuery } from 'src/common/helper/build-query.helper';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { name, email, pass_word } = registerDto;
    // console.log({ name, email, pass_word });

    // Xử lý kiểm tra account có tồn tại hay chưa? nếu chưa thì cho register, else thì thông báo user đã có rùi
    const userExist = await this.prisma.nguoidung.findUnique({
      where: {
        email: email, // key email là cột trong db (bảng users)
      },
    });

    if (userExist) {
      throw new BadRequestException(`Người dùng này đã tồn tại.`);
    }

    // hash: băm (không thể dịch ngược)$
    const hashPassword = bcrypt.hashSync(pass_word, 10);

    const newUser = await this.prisma.nguoidung.create({
      data: {
        email: email,
        pass_word: hashPassword,
        name: name,
      },
    });

    console.log({ email, pass_word, name, userExist });

    // return {
    //     title: "Register",
    //     email: email,
    //     password: password,
    //     fullName: fullName
    // };
    return 'Đăng ký người dùng mới thành công.'; //newUser;// vì các data về email, password là bảo mật, chỉ khi nào frontend cần thì mới return newUser
    // return body;
  }

  async login(loginDto: LoginDto) {
    const { email, pass_word } = loginDto;

    const userExist = await this.prisma.nguoidung.findUnique({
      where: {
        email: email, // chỉ lọc 1 field email
      },
    });

    if (!userExist) {
      throw new BadRequestException(`Người dùng chưa tồn tại. Hãy đăng ký`);
    }

    if (!pass_word || pass_word.length === 0) {
      throw new BadRequestException(
        'Vui lòng đăng nhập bằng Google, để cập nhật mật khẩu trong setting',
      );
    }
    /**
     * Kiểm tra mật khẩu
     * !Lưu ý: Mật khẩu trong db là mật khẩu đã mã hóa, nên ta không thể so sánh trực tiếp được
     * !Nên ta dùng bcrypt.compareSync( mật khẩu người dùng nhập, mật khẩu đã mã hóa trong db )
     * !Hàm này sẽ trả về true/false
     * !Nếu true thì đăng nhập thành công, nếu false thì đăng nhập thất bại
     */

    const isPassword = bcrypt.compareSync(pass_word, userExist.pass_word); // param1: pass chưa hash (pass thô), param2 (userExist.password) chính là pass trong db (pass đã hash)
    if (!isPassword) {
      throw new BadRequestException(`Mật khẩu không đúng`);
    }

    // Tạo ra 1 Token
    const tokens = this.tokenService.createToken(userExist.id);

    // sendMail(emailTo, subject);
    // sendMail("quyit84@gmail.com", "Test gửi mail từ NodeJS");

    return tokens;
  }

  getInfo(req: any) {
    // delete req.user.pass_word;
    return req.user;
  }

  async findAll(queryDto: QueryDto) {
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
        created_at: true
      },
      orderBy: [{ created_at: 'asc' }, { id: 'desc' }]
    });

    const totalItemPromise = this.prisma.nguoidung.count({ where: filters });

    // Truy vấn xuống db nên phải dùng await
    const [users, totalItem] = await Promise.all([
      usersPromise,
      totalItemPromise,
    ]); // vì user & totalItem chạy độc lập, nên ta cho nó chạy song song, bằng cách bỏ vào Promise.all() này. Ở trên ta bỏ await

    const totalPage = Math.ceil(totalItem / pageSize);


    return {
      thongBao: "Lấy danh sách Người dùng thành công",
      page: page,
      pageSize: pageSize,
      totalItem: totalItem, // SL bài viết
      totalPage: totalPage, // SL trang
      items: users || [],
    };
  }
}
