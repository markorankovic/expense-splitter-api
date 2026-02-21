import { IsInt, IsString, Min, MinLength } from 'class-validator';

export class UpdateExpenseDto {
  @IsString()
  @MinLength(1)
  description: string;

  @IsInt()
  @Min(1)
  amount: number;
}
