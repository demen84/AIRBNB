import { PartialType } from '@nestjs/swagger';
import { CreateNguoidungDto } from './create-nguoidung.dto';

export class UpdateNguoidungDto extends PartialType(CreateNguoidungDto) {}
