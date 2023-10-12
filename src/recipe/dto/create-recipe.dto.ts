import { IsNotEmpty, IsPositive } from 'class-validator';

export class CreateRecipeDto {
  name: string;
  info: string;
  image: string;
  isActive: number;
  price: number;
  discount: number;
  typeId: number;
}
