import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules-system/prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async register(body: any) {
    const { name, email, pass_word } = body;
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
    return true; //newUser;// vì các data về email, password là bảo mật, chỉ khi nào frontend cần thì mới return newUser
    // return body;
  }

  login() {}

  getInfo() {}
}
