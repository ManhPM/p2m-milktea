import {
  HttpException,
  HttpStatus,
  Injectable,
  Query,
  Request,
} from '@nestjs/common';
import { CreateExportDto } from './dto/create-export.dto';
import { UpdateExportDto } from './dto/update-export.dto';
import { Between, DataSource, Like, Repository, getConnection } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Export } from './entities/export.entity';
import { Ingredient } from '../ingredient/entities/ingredient.entity';
import { ExportIngredient } from '../export_ingredient/entities/export_ingredient.entity';
import { CreateExportIngredientDto } from '../export_ingredient/dto/create-export_ingredient.dto';
import { UpdateExportIngredientDto } from '../export_ingredient/dto/update-export_ingredient.dto';
import {
  MessageService,
  isDateGreaterThanNow,
  isValidDate,
} from '../common/lib';
import { Recipe } from '../recipe/entities/recipe.entity';

@Injectable()
export class ExportService {
  constructor(
    @InjectRepository(Export)
    readonly exportRepository: Repository<Export>,
    @InjectRepository(Ingredient)
    readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(Recipe)
    readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(ExportIngredient)
    readonly exportIngredientRepository: Repository<ExportIngredient>,
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
          res = await this.exportRepository.find({
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
          res = await this.exportRepository.find({
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
          res = await this.exportRepository.find({
            relations: ['staff'],
            where: {
              isCompleted: status,
            },
            order: {
              date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
            },
          });
        } else {
          res = await this.exportRepository.find({
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

  async findOne(id: number) {
    try {
      const res = await this.exportRepository.findOne({
        where: {
          id: id,
        },
        relations: ['staff', 'export_ingredients.ingredient'],
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

  async findIngredientExport(id: number): Promise<any> {
    try {
      const ingredients = await this.ingredientRepository.find({});
      const exportedIngredients = await this.exportIngredientRepository.find({
        where: {
          export: Like(id),
        },
      });
      const nonExportedIngredients = ingredients.filter(
        (ingredient) =>
          !exportedIngredients.some(
            (exportedIngredient) => exportedIngredient.id === ingredient.id,
          ),
      );
      return {
        data: nonExportedIngredients,
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

  async create(item: CreateExportDto, @Request() req) {
    try {
      const date = new Date();
      date.setHours(date.getHours() + 7);
      item.date = date;
      if (!item.description) {
        item.description = 'Mô tả';
      }
      const check = await this.exportRepository.findOne({
        where: {
          staff: req.user.id,
          isCompleted: 0,
        },
      });
      if (check) {
        throw new HttpException(
          {
            messageCode: 'EXPORT_ISEXIST_ERROR',
            data: check,
          },
          HttpStatus.BAD_REQUEST,
        );
      }
      const invoice = await this.exportRepository.save({
        ...item,
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
        if ((error.response.messageCode = 'EXPORT_ISEXIST_ERROR')) {
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

  async createIngredientExport(item: CreateExportIngredientDto) {
    return await this.dataSource.transaction(async (manager) => {
      try {
        const ingredientArray = item.ingredientId.split(',');
        const priceArray = item.price.split(',');
        const quantityArray = item.quantity.split(',');
        for (let i = 0; i < ingredientArray.length; i++) {
          const exportInvoice = await manager.getRepository(Export).findOne({
            where: {
              id: Number(item.exportId),
            },
          });
          const ingredient = await manager.getRepository(Ingredient).findOne({
            where: {
              id: Number(ingredientArray[i]),
            },
          });
          const exportIngredient = await manager
            .getRepository(ExportIngredient)
            .findOne({
              where: {
                export: Like(exportInvoice.id),
                ingredient: Like(ingredient.id),
              },
            });
          if (exportIngredient) {
            throw new HttpException(
              {
                messageCode: 'IMPORT_EXPORT_INGREDIENT_ERROR',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
          await manager.getRepository(ExportIngredient).save({
            price: Number(priceArray[i]),
            quantity: Number(quantityArray[i]),
            export: exportInvoice,
            ingredient: ingredient,
          });
        }
        const message = await this.messageService.getMessage('CREATE_SUCCESS');
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

  async deleteIngredientExport(item: UpdateExportIngredientDto) {
    try {
      const exportInvoice = await this.exportRepository.findOne({
        where: {
          id: item.exportId,
        },
      });
      const ingredient = await this.ingredientRepository.findOne({
        where: {
          id: item.ingredientId,
        },
      });
      await this.exportIngredientRepository.delete({
        ingredient: ingredient,
        export: exportInvoice,
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

  async completeExport(id: number) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const exportIngredients = await transactionalEntityManager
            .getRepository(ExportIngredient)
            .find({
              where: {
                export: Like(id),
              },
              relations: ['ingredient'],
            });
          let totalAmount = 0;
          for (const exportIngredient of exportIngredients) {
            totalAmount += exportIngredient.price;
            await transactionalEntityManager
              .createQueryBuilder()
              .update(Ingredient)
              .set({ quantity: () => '`quantity` - :newQuantity' })
              .where('id = :id', { id: exportIngredient.ingredient.id })
              .setParameter('newQuantity', exportIngredient.quantity)
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
          await transactionalEntityManager.update(Export, id, {
            total: totalAmount,
            isCompleted: 1,
          });

          const message = await this.messageService.getMessage(
            'COMPLETE_EXPORT_SUCCESS',
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

  async update(id: number, item: UpdateExportDto) {
    try {
      await this.exportRepository.update(id, {
        ...item,
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

  async remove(id: number) {
    try {
      const check = await this.exportRepository.findOne({
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
      await this.exportRepository.update(id, {
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
      return await this.exportRepository.findOne({
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
