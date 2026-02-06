import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class TwoFactorAuthenticationCodeDto {
    @ApiProperty({ example: '123456' })
    @IsString()
    code: string;
}
