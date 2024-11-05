import {
  ForbiddenException,
  HttpStatus,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { v4 as uuidv4 } from "uuid";
import { MailService } from "./email.service";
import { createResponse } from "src/utils/response.util";

@Injectable()
export class OtpService {
  private readonly otps = new Map(); // In-memory storage for simplicity (use Redis or DB for production)

  constructor() {}

  /**
   * Generates and sends an OTP via email.
   * @param email User's email address.
   * @returns OTP token for reference.
   */
  async sendOtp(email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6-digit OTP

    // Save OTP with expiry time (5 mins)
    this.otps.set(email, { otp, email, expiresAt: Date.now() + 5 * 60 * 1000 });
    const mailService = new MailService();

    // Send OTP to email
    await mailService.sendOtp(otp, email);
    return createResponse("Otp sent", HttpStatus.OK, null);
  }

  /**
   * Verifies the OTP based on the token and OTP provided by the user.
   * @param token OTP token.
   * @param otp OTP entered by the user.
   * @returns true if OTP is valid and not expired, false otherwise.
   */
  async verifyOtp(email: string, otp: string) {
    const storedOtpData = this.otps.get(email);

    if (!storedOtpData) {
      return false; // OTP not found
    }

    const { otp: storedOtp, expiresAt } = storedOtpData;

    // Check if OTP matches and hasn't expired
    if (otp === storedOtp && Date.now() <= expiresAt) {
      this.otps.delete(email); // Remove OTP after successful verification
      return createResponse("Otp Vverified successfully", HttpStatus.OK, true);
    }

    throw new ForbiddenException("Otp verification failed");
  }
}
