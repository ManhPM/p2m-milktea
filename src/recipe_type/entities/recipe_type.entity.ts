import { Recipe } from '../../recipe/entities/recipe.entity';
import { Type } from '../../type/entities/type.entity';
import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class RecipeType {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Recipe, (recipe) => recipe.recipe_types)
  recipe: Recipe;

  @ManyToOne(() => Type, (type) => type.recipe_types)
  type: Type;
}
