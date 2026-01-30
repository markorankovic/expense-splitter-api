import {
  ArrayMinSize,
  IsArray,
  IsInt,
  IsString,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ExpenseSplitDto {
  @IsString()
  @MinLength(1)
  userId: string;

  @IsInt()
  @Min(1)
  amount: number;
}

export class CreateExpenseDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(1)
  amount: number;

  @IsString()
  @MinLength(1)
  paidByUserId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ExpenseSplitDto)
  splits: ExpenseSplitDto[];
}
