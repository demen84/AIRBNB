import { SetMetadata } from '@nestjs/common';

export const IS_CHECK_PERMISION_KEY = 'isCheckPermision';
export const SkipPermision = () => SetMetadata(IS_CHECK_PERMISION_KEY, true);
