import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class PaginationDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export function paginate(page?: string | number, limit?: string | number) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  
  return {
    skip: (pageNum - 1) * limitNum,
    take: limitNum,
  };
}

export function buildPaginationMeta(
  page: string | number,
  limit: string | number,
  total: number,
) {
  const pageNum = Number(page) || 1;
  const limitNum = Number(limit) || 20;
  
  return {
    total,
    page: pageNum,
    limit: limitNum,
    totalPages: Math.ceil(total / limitNum),
  };
}