import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);


// export const OWNER_KEY = 'owner_key';
// export const Owner = (param = 'id') => SetMetadata(OWNER_KEY, param);