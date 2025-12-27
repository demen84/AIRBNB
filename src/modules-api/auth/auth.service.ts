import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  register(body: any) {
    const { name, email, pass_word } = body;
    console.log({ name, email, pass_word });

    // // Xử lý kiểm tra account có tồn tại hay chưa? nếu chưa thì cho register, else thì thông báo user đã có rùi
    // const userExist = await prisma.users.findUnique({
    //   where: {
    //     email: email, // key email là cột trong db (bảng users)
    //   },
    // });

    // if (userExist) {
    //   throw new BadRequestException(`Người dùng này đã tồn tại.`);
    // }

    // // hash: băm (không thể dịch ngược)$
    // const hashPassword = bcrypt.hashSync(password, 10);

    // const newUser = await prisma.users.create({
    //   data: {
    //     email: email,
    //     password: hashPassword,
    //     fullName: fullName,
    //   },
    // });

    // console.log({ email, password, fullName, userExist });

    // // return {
    // //     title: "Register",
    // //     email: email,
    // //     password: password,
    // //     fullName: fullName
    // // };
    // return true; //newUser;// vì các data về email, password là bảo mật, chỉ khi nào frontend cần thì mới return newUser
    return body;
  }

  login() {}

  getInfo() {}
}
