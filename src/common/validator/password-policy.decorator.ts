import { applyDecorators } from '@nestjs/common';
import { MinLength, Matches, MATCHES } from 'class-validator';
import { PASSWORD_MESSAGES } from '../constant/password.messages';

export function PasswordPolicy() {
  return applyDecorators(
    MinLength(8, { message: PASSWORD_MESSAGES.minLength }),
    Matches(/[a-z]/, { message: PASSWORD_MESSAGES.lower }),
    Matches(/[A-Z]/, { message: PASSWORD_MESSAGES.upper }),
    Matches(/\d/, { message: PASSWORD_MESSAGES.digit }),
    Matches(/[^A-Za-z0-9]/, { message: PASSWORD_MESSAGES.symbol }),
  );
}
