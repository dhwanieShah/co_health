import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcryptjs from "bcryptjs";
import { logger } from "src/logger/winston.logger";
import { ForgotPasswordDto } from "src/user/dto/forgot-password.dto";
import { LoginDto } from "src/user/dto/login-user.dto";
import { RegisterDto } from "src/user/dto/register-user.dto";
import { Repository } from "typeorm";
import { UserService } from "../user/user.service";

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new UnauthorizedException("User with this email is not found");
    }
    const passwordMatches = await bcryptjs.compare(pass, user.password);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid Credentials");
    }

    const { password: _, ...result } = user;
    return result;
    //   return user;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      return null;
    }

    const payload = { email: user.email, id: user.id };
    const secret = process.env.JWT_SECRET;
    // delete found_user.password;
    user.access_token = this.jwtService.sign(payload, { secret });
    return user;
  }

  async register(userData: RegisterDto) {
    try {
      const existingEntry = await this.userService.findByEmail(userData.email);

      if (existingEntry) {
        throw new ConflictException("User with this email id already exists");
      }
      const existingEntry2 = await this.userService.findByUserName(
        userData.username
      );

      if (existingEntry2) {
        throw new ConflictException("User with this username already exists");
      }

      const hashedPassword = await bcryptjs.hash(userData.password, 10);
      const user = await this.userService.create({
        ...userData,
        password: hashedPassword,
      });

      const { password, ...withoutPassword } = user;

      return withoutPassword;
    } catch (error) {
      throw error;
    }
  }

  async resetPassword(newPassword: string, user) {
    try {
      const updateResult = await this.userService.resetPassword(
        user.email,
        newPassword
      );
      if (updateResult) {
        return { message: "Password reset successful" };
      } else {
        throw new Error("Password reset failed");
      }
    } catch (error) {
      logger.error(error);
      throw new InternalServerErrorException("Failed to reset password");
    }
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    try {
      const user = await this.userService.findByEmail(
        email.toLocaleLowerCase()
      );
      if (!user || !user.password) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }
      return user;
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }
}
