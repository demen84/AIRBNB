import { SetMetadata } from '@nestjs/common';

export const OWNER_KEY = 'owner_key';

/**
 * @Owner('id')       → so sánh user.id với req.params.id
 * @Owner('postId')   → so sánh user.id với req.params.postId
 */
export const Owner = (param = 'id') => SetMetadata(OWNER_KEY, param);