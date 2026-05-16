import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import {
  CreateSignupDto,
  CreateLoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from '../dto/allDTO';
import * as bcrypt from 'bcrypt';
import { EmailService } from './email.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {}

  async signup(createSignupDto: CreateSignupDto): Promise<any> {
    if (!createSignupDto.password) {
      throw new BadRequestException('Password is required');
    }

    const existingUser = await this.userService.findUserByEmail(
      createSignupDto.email,
    );
    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(createSignupDto.password, salt);

    const user = await this.userService.registerUser({
      ...createSignupDto,
      password: hashedPassword,
      isVerified: true,
      otp: null,
      otpExpiry: null,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    const accessToken = this.generateAccessToken(
      user._id.toString(),
      user.email,
    );
    const refreshToken = this.generateRefreshToken(
      user._id.toString(),
      user.email,
    );

    return {
      success: true,
      data: {
        user: this.toAuthUser(user),
        accessToken,
        refreshToken,
      },
      message: 'User created successfully.',
    };
  }

  async login(createLoginDto: CreateLoginDto): Promise<any> {
    if (!createLoginDto.email || !createLoginDto.password) {
      throw new BadRequestException('Email and password are required');
    }

    const user = await this.userService.findUserByEmail(createLoginDto.email);
    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const passwordMatch = await bcrypt.compare(
      createLoginDto.password,
      user.password,
    );
    if (!passwordMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const otp = this.generateOtp();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
    await this.userService.updateUser(user._id.toString(), { otp, otpExpiry });
    await this.emailService.sendOTP(user.email, otp);

    return {
      success: true,
      message: 'OTP sent to your email. Please verify to complete login.',
    };
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<any> {
    const user = await this.userService.findUserByLoginOtp(verifyOtpDto.otp);

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.otp || !user.otpExpiry) {
      throw new BadRequestException('OTP not found');
    }

    if (user.otp !== verifyOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.otpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    const updatedUser = await this.userService.updateUser(user._id.toString(), {
      otp: null,
      otpExpiry: null,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const accessToken = this.generateAccessToken(
      updatedUser._id.toString(),
      updatedUser.email,
    );
    const refreshToken = this.generateRefreshToken(
      updatedUser._id.toString(),
      updatedUser.email,
    );

    return {
      success: true,
      data: {
        user: {
          ...this.toAuthUser(updatedUser),
        },
        accessToken,
        refreshToken,
      },
    };
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<any> {
    const user = await this.userService.findUserByEmail(forgotPasswordDto.email);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const resetOtp = this.generateOtp();
    const resetOtpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.userService.updateUserByEmail(forgotPasswordDto.email, {
      resetOtp,
      resetOtpExpiry,
    });
    await this.emailService.sendResetOTP(user.email, resetOtp);

    return {
      success: true,
      message: 'Reset OTP sent to your email.',
    };
  }

  async verifyResetOtp(verifyResetOtpDto: VerifyResetOtpDto): Promise<any> {
    const user = await this.userService.findUserByResetOtp(
      verifyResetOtpDto.otp,
    );

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      throw new BadRequestException('Reset OTP not found');
    }

    if (user.resetOtp !== verifyResetOtpDto.otp) {
      throw new BadRequestException('Invalid OTP');
    }

    if (user.resetOtpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    return {
      success: true,
      message: 'Reset OTP verified successfully.',
    };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<any> {
    const user = await this.userService.findUserByResetOtp(
      resetPasswordDto.otp,
    );

    if (!user) {
      throw new BadRequestException('Invalid OTP');
    }

    if (!user.resetOtp || !user.resetOtpExpiry) {
      throw new BadRequestException('Reset OTP not found');
    }

    if (user.resetOtpExpiry.getTime() < Date.now()) {
      throw new BadRequestException('OTP has expired');
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(resetPasswordDto.newPassword, salt);

    const updatedUser = await this.userService.updateUser(user._id.toString(), {
      password: hashedPassword,
      resetOtp: null,
      resetOtpExpiry: null,
    });

    if (!updatedUser) {
      throw new NotFoundException('User not found');
    }

    const accessToken = this.generateAccessToken(
      updatedUser._id.toString(),
      updatedUser.email,
    );
    const refreshToken = this.generateRefreshToken(
      updatedUser._id.toString(),
      updatedUser.email,
    );

    return {
      success: true,
      data: {
        user: this.toAuthUser(updatedUser),
        accessToken,
        refreshToken,
      },
      message: 'Password reset successfully.',
    };
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private generateAccessToken(userId: string, email: string): string {
    const payload = { userId, email };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: '1h', // 🔥 ACCESS TOKEN = 1 HOUR
    });
  }

  private generateRefreshToken(userId: string, email: string): string {
    const payload = { userId, email };

    return this.jwtService.sign(payload, {
      secret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      expiresIn: '7d', // 🔁 REFRESH TOKEN = 7 DAYS
    });
  }

  private toAuthUser(user: any) {
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      isVerified: user.isVerified,
    };
  }

  async validateUser(userId: string): Promise<any> {
    const user = await this.userService.findUserById(userId);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  }
}
