import {
  ConflictException,
  HttpException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import * as bcryptjs from "bcryptjs";
import { User } from "./entities/user.entity";
import { logger } from "src/logger/winston.logger";
import { createResponse } from "src/utils/response.util";
import { UpdateDto } from "./dto/update-user.dto";

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>
  ) {}

  async findByEmail(email: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { email } });
  }

  async findByUserName(username: string): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { username } });
  }

  async findById(id: number): Promise<User | undefined> {
    return this.userRepository.findOne({ where: { id } });
  }

  async create(userData: Partial<User>): Promise<User> {
    const user = this.userRepository.create(userData);
    return this.userRepository.save(user);
  }

  // user.service.ts
  async update(data: Partial<User>, userId: number): Promise<User> {
    await this.userRepository.update(userId, data);
    return this.findById(userId); // Fetch and return the updated user
  }

  async update_user(update_user: UpdateDto, req_user): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: req_user.id },
    });
    if (!user) {
      throw new UnauthorizedException("User not found.");
    }

    await this.userRepository.update(
      {
        id: req_user.id,
      },
      update_user
    );
    return createResponse("User updated successfully.", HttpStatus.OK);
  }

  async resetPassword(email: string, newPassword: string) {
    try {
      const user = await this.userRepository.findOne({ where: { email } });
      if (!user) {
        throw new HttpException("Invalid token", HttpStatus.UNAUTHORIZED);
      }

      user.password = await bcryptjs.hash(newPassword, 10);
      await this.userRepository.save(user);

      return { message: "Password reset successfully" };
    } catch (error) {
      logger.error(error);
      throw error;
    }
  }

  async changePassword(userId: number, changePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId },
      });
      if (!user) {
        throw new HttpException("User not found", HttpStatus.NOT_FOUND);
      }
      let passwordMatches = false;
      if (currentPassword) {
        passwordMatches = await bcryptjs.compare(
          currentPassword,
          user.password
        );
      }
      if (!passwordMatches && currentPassword) {
        throw new HttpException(
          "Current password is incorrect",
          HttpStatus.BAD_REQUEST
        );
      }

      user.password = await bcryptjs.hash(newPassword, 10);

      await this.userRepository.save(user);

      return { message: "Password changed successfully" };
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      } else {
        console.error(error);
        throw new HttpException(
          "Error changing password",
          HttpStatus.INTERNAL_SERVER_ERROR
        );
      }
    }
  }
}
