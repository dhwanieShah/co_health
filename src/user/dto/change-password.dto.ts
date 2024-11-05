import { IsOptional, IsString } from 'class-validator';

export class ChangePasswordDto {
  @IsOptional()
  @IsString()
  currentPassword: string;

  @IsString()
  newPassword: string;
}
