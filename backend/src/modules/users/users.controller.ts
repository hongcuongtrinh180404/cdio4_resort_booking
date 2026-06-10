import { Controller, Get, Param, Patch, Body, UseGuards, Request } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { Role } from "../../common/enums";
import { UpdateProfileDto } from "./dto/update-profile.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@ApiTags("users")
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get current user profile" })
  getProfile(@Request() req: any) {
    return this.usersService.findById(req.user.sub);
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Update current user profile" })
  updateProfile(@Request() req: any, @Body() dto: UpdateProfileDto) {
    return this.usersService.update(req.user.sub, dto);
  }

  @Patch("me/password")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Change current user password" })
  changePassword(@Request() req: any, @Body() dto: ChangePasswordDto) {
    return this.usersService.changePassword(req.user.sub, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: "Get all users (ADMIN only)" })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: "Get user by ID" })
  findOne(@Param("id") id: string) {
    return this.usersService.findById(Number(id));
  }
}
