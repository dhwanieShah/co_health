import {
  Body,
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Patch,
  Post,
  Req,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/jwt-auth.guard";
import { ChangePasswordDto } from "./dto/change-password.dto";
import { UpdateDto } from "./dto/update-user.dto";
import { UserService } from "./user.service";
import { OtpService } from "src/services/otp.service";

@Controller("user")
export class UserController {
  constructor(
    private readonly userService: UserService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("profile")
  async getProfile(@Req() req) {
    const userId = req.user["id"];
    return this.userService.findById(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post("change-password")
  async changePassword(
    @Body() changePasswordDto: ChangePasswordDto,
    @Req() req
  ) {
    const userId = req.user._id;
    return this.userService.changePassword(userId, changePasswordDto);
  }

  @UseGuards(JwtAuthGuard)
  @Patch()
  async update_user(@Body() UpdateDto: UpdateDto, @Req() req) {
    return this.userService.update_user(UpdateDto, req.user);
  }
}
