import { Injectable, UnauthorizedException,ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { User,UserRole } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<User> {
    const user = await this.userRepo.findOne({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return user;
  }


  async register(userData: { email: string; password: string; name: string; role?: string }) {
  const { email, password, name, role } = userData;

  const existingUser = await this.userRepo.findOne({ where: { email } });
  if (existingUser) {
    throw new ConflictException('Email already registered');
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const userRole: UserRole = role && Object.values(UserRole).includes(role as UserRole)
    ? (role as UserRole)
    : UserRole.READER;

  const newUser = this.userRepo.create({
    email,
    password: hashedPassword,
    name,
    role: userRole,
  });

  await this.userRepo.save(newUser);
  const { password: _, ...result } = newUser;
  return result;
}


  async login(user: User): Promise<{ access_token: string; user: Partial<User> }> {
  const payload = { sub: user.id, role: user.role, email: user.email };
  const access_token = this.jwtService.sign(payload);

  const { password, ...userWithoutPassword } = user;

  return {
    access_token,
    user: userWithoutPassword,
  };
 }
}
