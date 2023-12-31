import {
  HttpException,
  HttpStatus,
  Injectable,
  Query,
  Request,
} from '@nestjs/common';
import { CreateImportDto } from './dto/create-import.dto';
import { UpdateImportDto } from './dto/update-import.dto';
import { Import } from './entities/import.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, DataSource, Like, MoreThan, Repository } from 'typeorm';
import { Ingredient } from '../ingredient/entities/ingredient.entity';
import { ImportIngredient } from '../import_ingredient/entities/import_ingredient.entity';
import { CreateImportIngredientDto } from '../import_ingredient/dto/create-import_ingredient.dto';
import { UpdateImportIngredientDto } from '../import_ingredient/dto/update-import_ingredient.dto';
import {
  MessageService,
  isDateGreaterThanNow,
  isValidDate,
} from '../common/lib';
import { Recipe } from '../recipe/entities/recipe.entity';

@Injectable()
export class ImportService {
  constructor(
    @InjectRepository(Import)
    readonly importRepository: Repository<Import>,
    @InjectRepository(Recipe)
    readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(Ingredient)
    readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(ImportIngredient)
    readonly importIngredientRepository: Repository<ImportIngredient>,
    private dataSource: DataSource,
    private readonly messageService: MessageService,
  ) {}

  async findAll(@Query() query): Promise<any> {
    try {
      const fromDate = query.fromdate;
      const toDate = new Date(query.todate);
      toDate.setDate(toDate.getDate() + 1);
      toDate.setMinutes(toDate.getMinutes() - 1);
      const status = query.status;
      let res = [];
      if (fromDate && toDate) {
        if (status) {
          res = await this.importRepository.find({
            relations: ['staff'],
            where: {
              isCompleted: status,
              date: Between(fromDate, toDate),
            },
            order: {
              date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
            },
          });
        } else {
          res = await this.importRepository.find({
            relations: ['staff'],
            where: {
              date: Between(fromDate, toDate),
            },
            order: {
              date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
            },
          });
        }
      } else {
        if (status) {
          res = await this.importRepository.find({
            relations: ['staff'],
            where: {
              isCompleted: status,
            },
            order: {
              date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
            },
          });
        } else {
          res = await this.importRepository.find({
            relations: ['staff'],
            order: {
              date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
            },
          });
        }
      }
      return {
        data: res,
      };
    } catch (error) {
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async findIngredientImport(id: number): Promise<any> {
    try {
      const ingredients = await this.ingredientRepository.find({});
      const importedIngredients = await this.importIngredientRepository.find({
        where: {
          import: Like(id),
        },
        relations: ['ingredient'],
      });
      const nonImportedIngredients = ingredients.filter(
        (ingredient) =>
          !importedIngredients.some(
            (importedIngredient) =>
              importedIngredient.ingredient.id == ingredient.id,
          ),
      );
      return {
        data: nonImportedIngredients,
      };
    } catch (error) {
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async findOne(id: number) {
    try {
      const res = await this.importRepository.findOne({
        where: {
          id: id,
        },
        relations: ['staff', 'import_ingredients.ingredient'],
      });
      return res;
    } catch (error) {
      console.log(error);
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async completeImport(id: number) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const importIngredients = await transactionalEntityManager
            .getRepository(ImportIngredient)
            .find({
              where: {
                import: Like(id),
              },
              relations: ['ingredient'],
            });
          let totalAmount = 0;
          for (const importIngredient of importIngredients) {
            totalAmount += importIngredient.price;
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Ingredient)
              .set({ quantity: () => '`quantity` + :newQuantity' })
              .where('id = :id', { id: importIngredient.ingredient.id })
              .setParameter('newQuantity', importIngredient.quantity)
              .execute();
          }
          const recipes = await transactionalEntityManager
            .getRepository(Recipe)
            .find({
              where: {
                isActive: 2,
              },
              relations: ['recipe_ingredients.ingredient'],
            });
          if (recipes[0]) {
            for (const recipe of recipes) {
              let canActive = 1;
              for (let i = 0; i < recipe.recipe_ingredients.length; i++) {
                if (
                  recipe.recipe_ingredients[i].quantity >
                  recipe.recipe_ingredients[i].ingredient.quantity
                ) {
                  canActive = 0;
                }
                if (canActive) {
                  await transactionalEntityManager
                    .getRepository(Recipe)
                    .update(recipe.id, {
                      isActive: 1,
                    });
                }
              }
            }
          }
          console.log(totalAmount);
          await transactionalEntityManager.update(Import, id, {
            total: totalAmount,
            isCompleted: 1,
          });

          const message = await this.messageService.getMessage(
            'COMPLETE_IMPORT_SUCCESS',
          );
          return {
            message: message,
          };
        } catch (error) {
          const message = await this.messageService.getMessage(
            'INTERNAL_SERVER_ERROR',
          );
          throw new HttpException(
            {
              message: message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      },
    );
  }

  async create(createImportDto: CreateImportDto, @Request() req) {
    try {
      const date = new Date();
      date.setHours(date.getHours() + 7);
      createImportDto.date = date;
      const check = await this.importRepository.findOne({
        where: {
          staff: req.user.id,
          isCompleted: 0,
        },
      });
      if (!createImportDto.description) {
        createImportDto.description = 'Mô tả';
      }
      if (check) {
        throw new HttpException(
          {
            messageCode: 'IMPORT_ISEXIST_ERROR',
            data: check,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const invoice = await this.importRepository.save({
        ...createImportDto,
        staff: req.user.id,
      });
      const message = await this.messageService.getMessage('CREATE_SUCCESS');
      return {
        data: invoice,
        message: message,
      };
    } catch (error) {
      let message;
      if (error.response) {
        if ((error.response.messageCode = 'IMPORT_ISEXIST_ERROR')) {
          throw new HttpException(
            {
              data: error.response.data,
            },
            HttpStatus.OK,
          );
        }
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async update(id: number, updateImportDto: UpdateImportDto) {
    try {
      await this.importRepository.update(id, {
        ...updateImportDto,
      });
      const message = await this.messageService.getMessage('UPDATE_SUCCESS');

      return {
        message: message,
      };
    } catch (error) {
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async createIngredientImport(item: CreateImportIngredientDto) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const ingredientArray = item.ingredientId.split(',');
        const priceArray = item.price.split(',');
        const quantityArray = item.quantity.split(',');
        for (let i = 0; i < ingredientArray.length; i++) {
          const importInvoice = await manager.getRepository(Import).findOne({
            where: {
              id: Number(item.importId),
            },
          });
          const ingredient = await manager.getRepository(Ingredient).findOne({
            where: {
              id: Number(ingredientArray[i]),
            },
          });
          const importIngredient = await manager
            .getRepository(ImportIngredient)
            .findOne({
              where: {
                import: Like(importInvoice.id),
                ingredient: Like(ingredient.id),
              },
            });
          if (importIngredient) {
            throw new HttpException(
              {
                messageCode: 'IMPORT_EXPORT_INGREDIENT_ERROR',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
          await manager.getRepository(ImportIngredient).save({
            price: Number(priceArray[i]),
            quantity: Number(quantityArray[i]),
            import: importInvoice,
            ingredient: ingredient,
          });
        }
        const message = await this.messageService.getMessage('CREATE_SUCCESS');
        return {
          message: message,
        };
      } catch (error) {
        console.log(error);
        let message;
        if (error.response) {
          message = await this.messageService.getMessage(
            error.response.messageCode,
          );
          throw new HttpException(
            {
              message: message,
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          message = await this.messageService.getMessage(
            'INTERNAL_SERVER_ERROR',
          );
          throw new HttpException(
            {
              message: message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          );
        }
      }
    });
  }

  async deleteIngredientImport(item: UpdateImportIngredientDto) {
    try {
      const importInvoice = await this.importRepository.findOne({
        where: {
          id: item.importId,
        },
      });
      const ingredient = await this.ingredientRepository.findOne({
        where: {
          id: item.ingredientId,
        },
      });
      await this.importIngredientRepository.delete({
        ingredient: ingredient,
        import: importInvoice,
      });
      const message = await this.messageService.getMessage('DELETE_SUCCESS');
      return {
        message: message,
      };
    } catch (error) {
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async remove(id: number) {
    try {
      const check = await this.importRepository.findOne({
        where: {
          id: id,
        },
      });
      if (check.isCompleted != 0) {
        throw new HttpException(
          {
            messageCode: 'CANCEL_INVOICE_ERROR',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      await this.importRepository.update(id, {
        isCompleted: -1,
      });
      const message = await this.messageService.getMessage('CANCEL_SUCCESS');
      return {
        message: message,
      };
    } catch (error) {
      if (error.response) {
        const message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        const message = await this.messageService.getMessage(
          'INTERNAL_SERVER_ERROR',
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }

  async checkExist(id: number): Promise<any> {
    try {
      return await this.importRepository.findOne({
        where: { id },
      });
    } catch (error) {
      let message;
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.BAD_REQUEST,
        );
      } else {
        console.log(error);
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
        throw new HttpException(
          {
            message: message,
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    }
  }
}
