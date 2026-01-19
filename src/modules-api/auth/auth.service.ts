import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { TokenService } from 'src/modules-system/token/token.service';
import { generateSecret, verify } from 'otplib';
const { authenticator } = require('otplib');
import * as qrcode from 'qrcode';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tokenService: TokenService,
  ) { }

  async register(registerDto: RegisterDto) {
    const { name, email, pass_word } = registerDto;

    // 1. Chuẩn hóa input
    const normalizedEmail = email.toLowerCase().trim();
    // const trimmedName = name.trim();

    // 2. Kiểm tra email đã tồn tại chưa
    const userExist = await this.prisma.nguoidung.findUnique({
      where: {
        email: normalizedEmail, // key email là cột trong db (bảng users)
      },
    });

    if (userExist) {
      throw new BadRequestException(`Người dùng này đã tồn tại.`);
    }

    // 3. Hash password: băm (không thể dịch ngược)$
    const hashPassword = await bcrypt.hash(pass_word, 10);

    // 4. Tạo user mới với các giá trị mặc định
    const newUser = await this.prisma.nguoidung.create({
      data: {
        email: normalizedEmail,
        pass_word: hashPassword,
        name: name.trim(),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        created_at: true,
      },
    });

    // // 5. Tạo access token luôn (đăng ký xong tự login)
    // const accessToken = this.tokenService.generateAccessToken({
    //   id: newUser.id,
    //   email: newUser.email,
    //   role: newUser.role,
    // });

    // 6. Trả kết quả Response
    return {
      message: 'Đăng ký thành công',
      data: newUser,
      // data: {
      //   user: newUser,
      //   access_token: accessToken,
      // },
    };
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

    if (userExist.status === 'banned' || userExist.status === 'pending') {
      throw new ForbiddenException(
        'Tài khoản của bạn đã bị khóa. Vui lòng liên hệ Admin.',
      );
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

    // LOG thông tin
    // console.log('Kiểm tra user từ DB:', {
    //   email: userExist.email,
    //   is_2fa_enabled: userExist.is_2fa_enabled,
    //   type_of_2fa: typeof userExist.is_2fa_enabled
    // });


    // --- Kiểm tra 2FA ---
    if (userExist.is_2fa_enabled) {
      return {
        message: 'Yêu cầu mã xác thực 2FA',
        require_2fa: true,
        userId: userExist.id // Trả về id để FE biết cần verify cho ai.
      }
    }

    // Nếu không bật 2FA thì mới trả về Token như bình thường
    // Tạo ra 1 Token
    const tokens = this.tokenService.createToken(userExist.id);

    // sendMail(emailTo, subject);
    // sendMail("quyit84@gmail.com", "Test gửi mail từ NodeJS");

    return tokens;
  }

  async googleLogin(googleUser: any) {
    if (!googleUser) {
      throw new BadRequestException('Không có thông tin từ Google');
    }

    // 1. Kiểm tra xem email này đã tồn tại trong DB chưa
    let user = await this.prisma.nguoidung.findFirst({
      where: { email: googleUser.email },
    });

    // 2. Nếu chưa có, tiến hành đăng ký mới
    if (!user) {
      user = await this.prisma.nguoidung.create({
        data: {
          email: googleUser.email,
          name:
            `${googleUser.lastName || ''} ${googleUser.firstName || ''}`.trim() ||
            'Google User',
          avatar: googleUser.picture,
          // Password có thể để trống hoặc random chuỗi dài vì login qua Google
          pass_word: '',
          role: 'user',
          // Thêm các trường cần thiết khác theo schema của bạn
        },
      });
    }

    // --- Kiểm tra 2FA ---
    if (user.is_2fa_enabled) {
      return {
        message: 'Yêu cầu mã xác thực 2FA',
        require_2fa: true,
        userId: user.id,
      };
    }

    // 3. Tạo JWT token giống như login bình thường để trả về cho Frontend
    const payload = { id: user.id, email: user.email, role: user.role };
    // const token = this.jwtService.sign(payload);
    const token = this.tokenService.createToken(payload.id);

    const { pass_word, ...userWithoutPass } = user;

    return {
      message: 'Đăng nhập Google thành công',
      user: userWithoutPass,
      token,
    };
  }

  // 1. Tạo Secret và QR Code cho User
  async generate2FA(userId: number) {
    //1. Kiểm tra user có tồn tại?
    const user = await this.prisma.nguoidung.findUnique({
      where: { id: userId }
    });
    if (!user) {
      throw new BadRequestException(`Người dùng ${userId} không tồn tại`);
    }

    // 2. Tạo secret key (dạng string Base32)
    const secret = generateSecret();

    // 3. Xây dựng chuỗi OTP Auth URL theo chuẩn:
    // Định dạng: otpauth://totp/[Tên_App]:[Email]?secret=[Mã_Secret]&issuer=[Tên_App]
    const appName = 'MyAirbnb';
    const otpAuthUrl = `otpauth://totp/${appName}:${user.email}?secret=${secret}&issuer=${appName}`;

    // 4. Lưu secret vào DB dưới dạng Buffer (Bytes)
    await this.prisma.nguoidung.update({
      where: { id: userId },
      data: {
        two_fa_secret: Buffer.from(secret, 'utf-8')
      },
    });

    // 5. Chuyển URL thành hình ảnh mã QR
    const qrCodeImage = await qrcode.toDataURL(otpAuthUrl);

    return {
      qrCodeImage,
      secret
    };
  }

  async turnOn2FA(userId: number, code: string) {
    const user = await this.prisma.nguoidung.findUnique({
      where: { id: userId }
    });

    if (!user || !user.two_fa_secret) {
      throw new BadRequestException('Vui lòng tạo mã QR trước khi xác nhận');
    }

    // 1. Chuyển Buffer (Bytes) từ DB ngược lại thành chuỗi string
    const secret = Buffer.from(user.two_fa_secret).toString('utf-8');

    // 2. Xác thực mã 6 số (code) người dùng gửi lên
    const isValid = verify({
      token: code,
      secret: secret
    });

    if (!isValid) {
      throw new BadRequestException('Mã xác nhận không chính xác hoặc đã hết hạn');
    }

    // 3. Nếu đúng, chính thức bật cờ 2FA và lưu vào DB
    await this.prisma.nguoidung.update({
      where: { id: userId },
      data: { is_2fa_enabled: true },
    });

    return {
      message: 'Kích hoạt bảo mật 2 lớp (2FA) thành công',
    };
  }

  // Verify Login 2FA
  async verifyLogin2FA(userId: number, code: string) {
    const user = await this.prisma.nguoidung.findUnique({
      where: { id: userId }
    });

    if (!user || !user.two_fa_secret) {
      throw new BadRequestException('Yêu cầu không hợp lệ hoặc người dùng chưa bật 2FA');
    }

    const secret = Buffer.from(user.two_fa_secret).toString('utf-8');

    // LOG KIỂM TRA
    console.log('--- DEBUG VERIFY ---');
    console.log('User ID:', userId);
    console.log('Code gửi lên:', code);
    console.log('Secret lấy từ DB:', secret);

    // Xác thực mã OTP
    const isValid = verify({
      token: code,
      secret: secret
    });

    console.log('Kết quả Verify:', isValid);

    if (!isValid) {
      throw new BadRequestException('Mã OTP không đúng');
    }

    // Nếu mã đúng -> Chính thức cấp Token truy cập
    return this.tokenService.createToken(user.id);
  }

  getInfo(req: any) {
    delete req.user.pass_word;
    return req.user;
  }
}
