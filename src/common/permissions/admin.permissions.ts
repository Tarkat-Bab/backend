import { PermissionTypes } from 'src/common/enums/permissions.types.enum';
import { UsersTypes } from 'src/common/enums/users.enum';

export const AdminPermissions = {
 CREATE_USER: {
    enModule: 'Users',
    arModule: 'المستخدمين',
    key: PermissionTypes.CREATE,
    type: UsersTypes.ADMIN,
  },

  UPDATE_USER: {
    enModule: 'Users',
    arModule: 'المستخدمين',
    key: PermissionTypes.EDIT,  
    type: UsersTypes.ADMIN,
  },

  VIEW_USERS: {
    enModule: 'Users',
    arModule: 'المستخدمين',
    key: PermissionTypes.VIEW,
    type: UsersTypes.ADMIN,
  },

  DELETE_USERS: {
    enModule: 'Users',
    arModule: 'المستخدمين',
    key: PermissionTypes.DELETE,
    type: UsersTypes.ADMIN,
  },
  
};
