import { UserService } from '../src/modules/user/user.service';
import { UserModel } from '../src/modules/user/user.model';

jest.mock('../src/modules/user/user.model');

describe('UserService', () => {
  let userService: UserService;

  beforeEach(() => {
    jest.clearAllMocks();
    userService = new UserService();
  });

  it('should return null for unknown id', async () => {
    (UserModel.findById as jest.Mock).mockResolvedValue(null);
    const found = await userService.getUserById('nonexistent');
    expect(found).toBeNull();
  });

  it('should get all active users', async () => {
    const mockUsers = [
      {
        _id: { toString: () => '1' },
        email: 'a@example.com',
        name: 'User A',
        role: 'validation_engineer',
        isActive: true,
        lastLoginAt: null,
        createdAt: new Date(),
      },
    ];
    (UserModel.find as jest.Mock).mockResolvedValue(mockUsers);
    const users = await userService.getAllUsers();
    expect(users).toHaveLength(1);
    expect(users[0]).not.toHaveProperty('passwordHash');
  });
});
