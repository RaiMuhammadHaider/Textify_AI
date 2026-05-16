import { Controller, Body, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  CreateSignupDto,
  CreateLoginDto,
  VerifyOtpDto,
  ForgotPasswordDto,
  VerifyResetOtpDto,
  ResetPasswordDto,
} from '../dto/allDTO';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'User Signup' })
  @ApiResponse({ status: 201, description: 'User created successfully!' })
  @ApiBody({ type: CreateSignupDto })
  signup(@Body() createSignupDto: CreateSignupDto) {
    return this.authService.signup(createSignupDto);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'User Login' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiBody({ type: CreateLoginDto })
  login(@Body() createLoginDto: CreateLoginDto) {
    return this.authService.login(createLoginDto);
  }

  @Post('verify-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify login OTP' })
  @ApiResponse({ status: 200, description: 'Login OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiBody({ type: VerifyOtpDto })
  verifyOtp(@Body() verifyOtpDto: VerifyOtpDto) {
    return this.authService.verifyOtp(verifyOtpDto);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Send forgot password OTP' })
  @ApiResponse({ status: 200, description: 'Reset OTP sent successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiBody({ type: ForgotPasswordDto })
  forgotPassword(@Body() forgotPasswordDto: ForgotPasswordDto) {
    return this.authService.forgotPassword(forgotPasswordDto);
  }

  @Post('verify-reset-otp')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Verify forgot password OTP' })
  @ApiResponse({ status: 200, description: 'Reset OTP verified successfully' })
  @ApiResponse({ status: 400, description: 'Invalid or expired OTP' })
  @ApiBody({ type: VerifyResetOtpDto })
  verifyResetOtp(@Body() verifyResetOtpDto: VerifyResetOtpDto) {
    return this.authService.verifyResetOtp(verifyResetOtpDto);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset user password' })
  @ApiResponse({ status: 200, description: 'Password reset successfully' })
  @ApiResponse({ status: 400, description: 'Invalid reset request' })
  @ApiBody({ type: ResetPasswordDto })
  resetPassword(@Body() resetPasswordDto: ResetPasswordDto) {
    return this.authService.resetPassword(resetPasswordDto);
  }
}
