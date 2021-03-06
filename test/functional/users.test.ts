import { User } from '@src/database/models/users';
import AuthService from '@src/services/auth';

describe('Users functional tests', () => {
  beforeEach(async () => {
    await User.deleteMany({});
  });
  describe('When creating a new user', () => {
    it('should successfully create a new user with encrypted password', async () => {
      const newUser = {
        name: 'Gabriel Duque',
        email: 'gabrieldorkt@gmail.com',
        password: '1234',
      };

      const response = await global.testRequest.post('/users/created').send(newUser);

      expect(response.status).toBe(201);
      await expect(
        AuthService.validatePassword(newUser.password, response.body.password)
      ).resolves.toBeTruthy();

      expect(response.body).toEqual(
        expect.objectContaining({
          ...newUser,
          ...{ password: expect.any(String) },
        })
      );
    });

    it('Should return a validation error when a field is missing', async () => {
      const newUser = {
        email: 'gabrieldorkt@gmail.com',
        password: '1234',
      };
      const response = await global.testRequest.post('/users/created').send(newUser);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        code: 422,
        error: 'User validation failed: name: Path `name` is required.',
      });
    });

    it('Should return 500 when the email already exists', async () => {
      const newUser = {
        name: 'Gabriel Duque',
        email: 'gabrieldorkt@gmail.com',
        password: '1234',
      };
      await global.testRequest.post('/users/created').send(newUser);
      const response = await global.testRequest.post('/users/created').send(newUser);

      expect(response.status).toBe(422);
      expect(response.body).toEqual({
        code: 422,
        error: 'User validation failed: email: already exists in the database'
      });
    });
  });

  describe('When authenticating a user', () => {
    it('should generate a token for a valid user', async () => {
      const newUser = {
        name: 'Gabriel Duque',
        email: 'gabrieldorkt@gmail.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users')
        .send({ email: newUser.email, password: newUser.password });

      expect(response.body).toEqual(
        expect.objectContaining({ token: expect.any(String) })
      );
    });

    it('Should return UNAUTHORIZED if the user with the given email is not found', async () => {
      const response = await global.testRequest
        .post('/users')
        .send({ email: 'some-email@mail.com', password: '1234' });

      expect(response.status).toBe(401);
    });

    it('Should return ANAUTHORIZED if the user is found but the password does not match', async () => {
      const newUser = {
        name: 'John Doe',
        email: 'john@mail.com',
        password: '1234',
      };
      await new User(newUser).save();
      const response = await global.testRequest
        .post('/users')
        .send({ email: newUser.email, password: 'different password' });

      expect(response.status).toBe(401);
    });
  });
});