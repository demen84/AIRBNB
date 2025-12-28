import { Injectable } from '@nestjs/common';
import * as jwt from 'jsonwebtoken';
import {
  ACCESS_TOKEN_SECRET,
  ACCESS_TOKEN_TTL,
  REFRESH_TOKEN_SECRET,
  REFRESH_TOKEN_TTL,
} from 'src/common/constant/app.constant';

@Injectable()
export class TokenService {
  // Tạo accessToken bằng userId (Id của bảng Users trong db)
  createToken(userId: number) {
    // hạn sử dụng của access token
    // cần được giảm xuống đáng kể, để giảm thiểu rủi ro khi người dùng bị lộ token
    // thời gian hết hạn tồn tại bao nhiêu thì người dùng rủi ro bấy nhiêu (nếu bị lộ)
    const accessToken = jwt.sign(
      { userId: userId },
      ACCESS_TOKEN_SECRET as string,
      {
        expiresIn: ACCESS_TOKEN_TTL,
        // expiresIn: '1d',
      },
    ); // hạn dùng 1000 minutes

    // hạn sử dụng của refresh token, thời gian của refresh token sẽ dài hơn nhiều so với access token
    // khi access token hết hạn, người dùng sẽ dùng refresh token để lấy access token mới
    const refreshToken = jwt.sign(
      { userId: userId },
      REFRESH_TOKEN_SECRET as string,
      {
        expiresIn: REFRESH_TOKEN_TTL,
      },
    ); // hạn dùng 1 ngày

    return {
      accessToken: accessToken,
      refreshToken: refreshToken,
    };
  }

  verifyAccessToken(accessToken: string, option?: jwt.VerifyOptions) {
    const decodeAccessToken = jwt.verify(
      accessToken,
      ACCESS_TOKEN_SECRET as string,
      option,
    );

    return decodeAccessToken; // !jwt.verify/decodeAccessToken trả về 1 object chứa userId và iat, exp. Vd: { userId: 1, iat: 1696544323, exp: 1699136323 }
  }

  verifyRefreshToken(refreshToken: string) {
    const decodeRefreshToken = jwt.verify(
      refreshToken,
      REFRESH_TOKEN_SECRET as string,
    );
    return decodeRefreshToken;
  }
}

// const tokenService = new TokenService();
