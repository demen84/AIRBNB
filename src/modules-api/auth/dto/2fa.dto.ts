import { IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Verify2FADto {
    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    code: string;
}

export class Login2FADto {
    @ApiProperty({ example: '10' })
    @IsNumber()
    userId: number;

    @ApiProperty({ example: '123456' })
    @IsString()
    @IsNotEmpty()
    code: string;
}