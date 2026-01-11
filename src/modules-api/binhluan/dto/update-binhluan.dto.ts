import { PartialType } from '@nestjs/swagger';
import { CreateBinhluanDto } from './create-binhluan.dto';

export class UpdateBinhluanDto extends PartialType(CreateBinhluanDto) {}
