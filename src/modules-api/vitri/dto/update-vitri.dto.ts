import { PartialType } from '@nestjs/swagger';
import { CreateVitriDto } from './create-vitri.dto';

export class UpdateVitriDto extends PartialType(CreateVitriDto) {}
