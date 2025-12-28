import { IsJSON, IsNotEmpty, IsNumber, IsOptional, Min } from 'class-validator';

export class QueryDto {
  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  page: number;

  @IsNumber()
  @IsNotEmpty()
  @Min(1)
  pageSize: number;

  @IsOptional()
  @IsJSON()
  filters?: string; // ? : có thể truyền or không truyền
}
