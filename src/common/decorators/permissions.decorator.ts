import { SetMetadata } from '@nestjs/common';
import { UsersTypes } from '../enums/users.enum';

export const Permissions = (permissions: {
  enModule: string;
  arModule: string;
  key: string;
  type: UsersTypes;
}) => SetMetadata('permissions', permissions);
