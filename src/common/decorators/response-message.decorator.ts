import { SetMetadata } from '@nestjs/common';

export const KEY_MESSAGE_RESPONSE = 'KEY_MESSAGE_RESPONSE';

export const ResponseMessage = (message: string) => {
  return SetMetadata(KEY_MESSAGE_RESPONSE, message);
};
