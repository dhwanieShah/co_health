import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import { AuthService } from "./auth.service";
import { RegisterDto } from "src/user/dto/register-user.dto";
import { LoginDto } from "src/user/dto/login-user.dto";
import { ForgotPasswordDto } from "src/user/dto/forgot-password.dto";
import * as jwt from "jsonwebtoken"; // For decoding the token
import { OtpService } from "src/services/otp.service";
import { UserService } from "src/user/user.service";
import { JwtService } from "@nestjs/jwt";
import { JwtAuthGuard } from "./jwt-auth.guard";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly otpService: OtpService,
    private readonly userService: UserService,
    private readonly jwtService: JwtService
  ) {}

  @Post("register")
  async register(@Body() registerDto: RegisterDto) {
    const data = await this.authService.register(registerDto);
    if (data) {
      await this.otpService.sendOtp(registerDto.email);
    }
    return {
      statusCode: HttpStatus.CREATED,
      message: "Please check your email for OTP",
      data: null,
    };
  }

  @Post("login")
  async login(@Body() loginDto: LoginDto) {
    loginDto.email = loginDto.email.toLowerCase();
    const user = await this.authService.login(loginDto);
    if (!user.is_verified) {
      await this.otpService.sendOtp(loginDto.email);
      return {
        statusCode: HttpStatus.CREATED,
        message: "Please check your email for OTP",
        data: null,
      };
    }
    return {
      message: "Login successful",
      statusCode: HttpStatus.OK,
      data: user,
    };
  }

  @Post("forgot-password")
  async forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    const user = await this.authService.forgotPassword(forgotPasswordDto);
    if (user) {
      await this.otpService.sendOtp(forgotPasswordDto.email);
      return {
        statusCode: HttpStatus.CREATED,
        message: "Please check your email for OTP",
        data: null,
      };
    }
  }

  @UseGuards(JwtAuthGuard)
  @Post("reset-password")
  async resetPassword(@Body() resetPasswordDto, @Req() req) {
    const { email, newPassword } = resetPasswordDto;
    try {
      return this.authService.resetPassword(newPassword, req.user);
    } catch (error) {
      throw new UnauthorizedException("Invalid or expired token");
    }
  }

  @Post("verify-otp")
  async verifyOtp(@Body("email") email: string, @Body("otp") otp: string) {
    if (!email || !otp) {
      throw new HttpException(
        "Email and OTP are required",
        HttpStatus.BAD_REQUEST
      );
    }
    const isValid = await this.otpService.verifyOtp(email, otp);
    if (!isValid) {
      throw new HttpException("Invalid OTP", HttpStatus.UNAUTHORIZED);
    }
    const user = await this.userService.findByEmail(email);
    if (!user) {
      throw new HttpException("User not found", HttpStatus.NOT_FOUND);
    }
    const result = await this.userService.update(
      { is_verified: true },
      user.id
    );
    const { password, ...userWithoutPassword } = result;
    const secret = process.env.JWT_SECRET; // Destructure if you want to use this in multiple places
    const payload = { email: user.email, id: user.id };
    const access_token = this.jwtService.sign(payload, { secret });
    return {
      success: true,
      message: "OTP verified successfully",
      data: {
        ...userWithoutPassword,
        access_token,
      },
    };
  }
}
