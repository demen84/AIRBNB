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
import * as qrcode from 'qrcode';
import { generateSecret, generate, verify, generateURI } from 'otplib';

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
        userId: userExist.id, // Trả về id để FE biết cần verify cho ai.
      };
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
    // 1. Kiểm tra user tồn tại
    const user = await this.prisma.nguoidung.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException(`Người dùng ${userId} không tồn tại`);
    }

    // 2. Ngăn chặn nếu đã bật 2FA rồi (không cho generate lại)
    if (user.is_2fa_enabled) {
      throw new BadRequestException(
        'Bảo mật 2 lớp đã được kích hoạt. Không cần tạo QR mới.',
      );
    }

    // ────────────────────────────────────────────────
    // Logic chọn secret (tái sử dụng nếu đã có)
    let secret: string;

    if (user.two_fa_secret && !user.is_2fa_enabled) {
      // Đã có secret tạm (từ lần generate trước), dùng lại thay vì tạo mới
      secret = user.two_fa_secret as string;
      console.log('DEBUG: Tái sử dụng secret cũ đã lưu trong DB');
    } else {
      // Chưa có secret → tạo mới và lưu vào DB
      secret = generateSecret();
      await this.prisma.nguoidung.update({
        where: { id: userId },
        data: { two_fa_secret: secret },
      });
      console.log('DEBUG: Tạo secret mới và lưu vào DB');
    }
    // ────────────────────────────────────────────────

    // 3. Tạo URI và QR code
    const otpAuthUri = generateURI({
      secret,
      label: user.email,
      issuer: 'Airbnb_System',
    });

    const qrCodeImage = await qrcode.toDataURL(otpAuthUri);

    return {
      qrCodeImage,
      // secret, vì bảo mật nên không show thông tin này.
    };
  }

  async turnOn2FA(userId: number, code: string) {
    const user = await this.prisma.nguoidung.findUnique({
      where: { id: userId },
    });

    if (!user || !user.two_fa_secret) {
      throw new BadRequestException('Vui lòng tạo mã QR trước khi xác nhận');
    }

    const secret = user.two_fa_secret as string;

    const result = await verify({ token: code, secret });
    const isValid = result.valid;

    // console.log('Result', result);
    // console.log(
    //   '--- TEST 2FA --- Mã nhập:',
    //   code,
    //   ' | Hợp lệ:',
    //   isValid,
    //   ' | Full result:',
    //   result,
    // );

    if (!isValid) {
      throw new BadRequestException(
        'Mã xác nhận không chính xác hoặc đã hết hạn. Không thể bật 2FA',
      );
    }

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
      where: { id: userId },
    });

    if (!user || !user.two_fa_secret) {
      throw new BadRequestException(
        'Yêu cầu không hợp lệ hoặc người dùng chưa bật 2FA',
      );
    }

    const secret = user.two_fa_secret as string;

    // Sửa ở đây: Lấy .valid từ object kết quả
    const result = await verify({ token: code, secret }); // trả vể kiểu object (VerifyResult)
    const isValid = result.valid;  // trả về kiểu boolean để kiểm tra

    // // Log để debug (xóa sau khi test xong)
    // console.log('DEBUG verifyLogin2FA:', {
    //   inputCode: code,
    //   secret: secret.substring(0, 10) + '...', // ẩn bớt để log an toàn
    //   isValid,
    //   fullResult: result,  // xem delta, epoch nếu cần
    // });

    if (!isValid) {
      throw new BadRequestException('Mã OTP không đúng hoặc hết hạn');
    }

    // Cấp token truy cập chỉ khi isValid === true
    return this.tokenService.createToken(user.id);
  }

  getInfo(req: any) {
    delete req.user.pass_word;
    return req.user;
  }
}
