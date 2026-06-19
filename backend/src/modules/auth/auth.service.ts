import { Injectable, NotFoundException, UnauthorizedException, BadRequestException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcryptjs";
import { Resend } from "resend";
import { UsersService } from "../users/users.service";
import { PrismaService } from "../../database/prisma/prisma.service";
import { RegisterDto } from "./dto/register.dto";
import { LoginDto } from "./dto/login.dto";
import { ForgotPasswordDto } from "./dto/forgot-password.dto";
import { ResetPasswordDto } from "./dto/reset-password.dto";

@Injectable()
export class AuthService {
  private resend: Resend;

  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService
  ) {
    this.resend = new Resend(this.configService.get<string>("RESEND_API_KEY") ?? "");
  }

  async register(dto: RegisterDto) {
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await this.usersService.create({
      ...dto,
      password: hashedPassword,
    });
    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return { user, token };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) throw new UnauthorizedException("Invalid credentials");

    if (user.status === "LOCKED") throw new UnauthorizedException("Tài khoản đã bị khóa");

    const isMatch = await bcrypt.compare(dto.password, user.password);
    if (!isMatch) throw new UnauthorizedException("Invalid credentials");

    const token = this.jwtService.sign({
      sub: user.id,
      email: user.email,
      role: user.role,
    });
    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
      token,
    };
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    const user = await this.usersService.findByEmail(dto.email);
    if (!user) {
      return { message: "Mã code đã được gửi tới gmail đăng ký của bạn" };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const hashedCode = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { resetCode: hashedCode, resetCodeExpires: expiresAt },
    });

    console.log(`[RESET CODE] ${user.email}: ${code}`);

    try {
      await this.resend.emails.send({
        from: "onboarding@resend.dev",
        to: user.email,
        subject: "Mã xác nhận đặt lại mật khẩu DTUVIVI",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
            <h2>DTUVIVI - Đặt lại mật khẩu</h2>
            <p>Mã xác nhận của bạn là:</p>
            <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; text-align: center; padding: 16px; background: #f3f4f6; border-radius: 8px; margin: 16px 0;">
              ${code}
            </div>
            <p>Mã có hiệu lực trong 5 phút.</p>
            <p style="color: #6b7280; font-size: 12px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
          </div>
        `,
      });
    } catch (err) {
      console.error("[RESEND ERROR]", err);
    }

    return { message: "Mã code đã được gửi tới gmail đăng ký của bạn" };
  }

  async resetPassword(dto: ResetPasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      throw new BadRequestException("Mã xác nhận không hợp lệ hoặc đã hết hạn");
    }

    if (new Date() > user.resetCodeExpires) {
      throw new BadRequestException("Mã xác nhận đã hết hạn");
    }

    const isValid = await bcrypt.compare(dto.code, user.resetCode);
    if (!isValid) {
      throw new BadRequestException("Mã xác nhận không đúng");
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetCode: null,
        resetCodeExpires: null,
      },
    });

    return { message: "Mật khẩu đã được đặt lại thành công" };
  }

  async verifyResetCode(email: string, code: string) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });
    if (!user || !user.resetCode || !user.resetCodeExpires) {
      throw new BadRequestException("Mã xác nhận không hợp lệ");
    }
    if (new Date() > user.resetCodeExpires) {
      throw new BadRequestException("Mã xác nhận đã hết hạn");
    }
    const isValid = await bcrypt.compare(code, user.resetCode);
    if (!isValid) {
      throw new BadRequestException("Mã xác nhận không đúng");
    }
    return { message: "OK" };
  }
}
