import { IsDate, IsEmail, IsOptional, IsString, Length } from "class-validator";

export class UpdateDto {
  @IsOptional()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  username: string;

  @IsOptional()
  @IsString()
  first_name: string;

  @IsOptional()
  @IsString()
  last_name: string;

  @IsString()
  @IsOptional()
  birth_date: Date;
}
