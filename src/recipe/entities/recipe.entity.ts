import { ProductRecipe } from 'src/product_recipe/entities/product_recipe.entity';
import { RecipeIngredient } from 'src/recipe_ingredient/entities/recipe_ingredient.entity';
import { RecipeType } from 'src/recipe_type/entities/recipe_type.entity';
import { Review } from 'src/review/entities/review.entity';
import { Type } from 'src/type/entities/type.entity';
import { Wishlist } from 'src/wishlist/entities/wishlist.entity';
import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Recipe {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column()
  info: string;

  @Column()
  image: string;

  @Column()
  isActive: number;

  @Column()
  price: number;

  @Column()
  discount: number;

  @ManyToOne(() => Type, (item) => item.recipes)
  type: Type;

  @OneToMany(() => ProductRecipe, (item) => item.recipe)
  product_recipes: ProductRecipe[];

  @OneToMany(() => RecipeIngredient, (item) => item.recipe)
  recipe_ingredients: RecipeIngredient[];

  @OneToMany(() => RecipeType, (item) => item.recipe)
  recipe_types: RecipeType[];

  @OneToMany(() => Wishlist, (item) => item.recipe)
  wishlists: Wishlist[];

  @OneToMany(() => Review, (item) => item.recipe)
  reviews: Review[];
}
