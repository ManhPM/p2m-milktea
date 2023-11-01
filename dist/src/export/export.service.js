"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExportService = void 0;
const common_1 = require("@nestjs/common");
const create_export_dto_1 = require("./dto/create-export.dto");
const typeorm_1 = require("typeorm");
const typeorm_2 = require("@nestjs/typeorm");
const export_entity_1 = require("./entities/export.entity");
const ingredient_entity_1 = require("../ingredient/entities/ingredient.entity");
const export_ingredient_entity_1 = require("../export_ingredient/entities/export_ingredient.entity");
const lib_1 = require("../common/lib");
const recipe_entity_1 = require("../recipe/entities/recipe.entity");
let ExportService = class ExportService {
    constructor(exportRepository, ingredientRepository, recipeRepository, exportIngredientRepository, dataSource, messageService) {
        this.exportRepository = exportRepository;
        this.ingredientRepository = ingredientRepository;
        this.recipeRepository = recipeRepository;
        this.exportIngredientRepository = exportIngredientRepository;
        this.dataSource = dataSource;
        this.messageService = messageService;
    }
    async findAll(query) {
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
                            date: (0, typeorm_1.Between)(fromDate, toDate),
                        },
                        order: {
                            date: 'DESC',
                        },
                    });
                }
                else {
                    res = await this.exportRepository.find({
                        relations: ['staff'],
                        where: {
                            date: (0, typeorm_1.Between)(fromDate, toDate),
                        },
                        order: {
                            date: 'DESC',
                        },
                    });
                }
            }
            else {
                if (status) {
                    res = await this.exportRepository.find({
                        relations: ['staff'],
                        where: {
                            isCompleted: status,
                        },
                        order: {
                            date: 'DESC',
                        },
                    });
                }
                else {
                    res = await this.exportRepository.find({
                        relations: ['staff'],
                        order: {
                            date: 'DESC',
                        },
                    });
                }
            }
            return {
                data: res,
            };
        }
        catch (error) {
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async findOne(id) {
        try {
            const res = await this.exportRepository.findOne({
                where: {
                    id: id,
                },
                relations: ['staff', 'export_ingredients.ingredient'],
            });
            return res;
        }
        catch (error) {
            console.log(error);
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async findIngredientExport(id) {
        try {
            const ingredients = await this.ingredientRepository.find({});
            const exportedIngredients = await this.exportIngredientRepository.find({
                where: {
                    export: (0, typeorm_1.Like)(id),
                },
            });
            const nonExportedIngredients = ingredients.filter((ingredient) => !exportedIngredients.some((exportedIngredient) => exportedIngredient.id === ingredient.id));
            return {
                data: nonExportedIngredients,
            };
        }
        catch (error) {
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async create(item, req) {
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
                throw new common_1.HttpException({
                    messageCode: 'EXPORT_ISEXIST_ERROR',
                    data: check,
                }, common_1.HttpStatus.BAD_REQUEST);
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
        }
        catch (error) {
            let message;
            if (error.response) {
                if ((error.response.messageCode = 'EXPORT_ISEXIST_ERROR')) {
                    throw new common_1.HttpException({
                        data: error.response.data,
                    }, common_1.HttpStatus.OK);
                }
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async createIngredientExport(item) {
        return await this.dataSource.transaction(async (manager) => {
            try {
                const ingredientArray = item.ingredientId.split(',');
                const priceArray = item.price.split(',');
                const quantityArray = item.quantity.split(',');
                for (let i = 0; i < ingredientArray.length; i++) {
                    const exportInvoice = await manager.getRepository(export_entity_1.Export).findOne({
                        where: {
                            id: Number(item.exportId),
                        },
                    });
                    const ingredient = await manager.getRepository(ingredient_entity_1.Ingredient).findOne({
                        where: {
                            id: Number(ingredientArray[i]),
                        },
                    });
                    const exportIngredient = await manager
                        .getRepository(export_ingredient_entity_1.ExportIngredient)
                        .findOne({
                        where: {
                            export: (0, typeorm_1.Like)(exportInvoice.id),
                            ingredient: (0, typeorm_1.Like)(ingredient.id),
                        },
                    });
                    if (exportIngredient) {
                        throw new common_1.HttpException({
                            messageCode: 'IMPORT_EXPORT_INGREDIENT_ERROR',
                        }, common_1.HttpStatus.BAD_REQUEST);
                    }
                    await manager.getRepository(export_ingredient_entity_1.ExportIngredient).save({
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
            }
            catch (error) {
                let message;
                if (error.response) {
                    message = await this.messageService.getMessage(error.response.messageCode);
                    throw new common_1.HttpException({
                        message: message,
                    }, common_1.HttpStatus.BAD_REQUEST);
                }
                else {
                    message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                    throw new common_1.HttpException({
                        message: message,
                    }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
                }
            }
        });
    }
    async deleteIngredientExport(item) {
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
        }
        catch (error) {
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async completeExport(id) {
        return await this.dataSource.transaction(async (transactionalEntityManager) => {
            try {
                const exportIngredients = await transactionalEntityManager
                    .getRepository(export_ingredient_entity_1.ExportIngredient)
                    .find({
                    where: {
                        export: (0, typeorm_1.Like)(id),
                    },
                    relations: ['ingredient'],
                });
                let totalAmount = 0;
                for (const exportIngredient of exportIngredients) {
                    totalAmount += exportIngredient.price;
                    await transactionalEntityManager
                        .createQueryBuilder()
                        .update(ingredient_entity_1.Ingredient)
                        .set({ quantity: () => '`quantity` - :newQuantity' })
                        .where('id = :id', { id: exportIngredient.ingredient.id })
                        .setParameter('newQuantity', exportIngredient.quantity)
                        .execute();
                }
                const recipes = await transactionalEntityManager
                    .getRepository(recipe_entity_1.Recipe)
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
                            if (recipe.recipe_ingredients[i].quantity >
                                recipe.recipe_ingredients[i].ingredient.quantity) {
                                canActive = 0;
                            }
                            if (canActive) {
                                await transactionalEntityManager
                                    .getRepository(recipe_entity_1.Recipe)
                                    .update(recipe.id, {
                                    isActive: 1,
                                });
                            }
                        }
                    }
                }
                await transactionalEntityManager.update(export_entity_1.Export, id, {
                    total: totalAmount,
                    isCompleted: 1,
                });
                const message = await this.messageService.getMessage('COMPLETE_EXPORT_SUCCESS');
                return {
                    message: message,
                };
            }
            catch (error) {
                const message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        });
    }
    async update(id, item) {
        try {
            await this.exportRepository.update(id, {
                ...item,
            });
            const message = await this.messageService.getMessage('UPDATE_SUCCESS');
            return {
                message: message,
            };
        }
        catch (error) {
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async remove(id) {
        try {
            const check = await this.exportRepository.findOne({
                where: {
                    id: id,
                },
            });
            if (check.isCompleted != 0) {
                throw new common_1.HttpException({
                    messageCode: 'CANCEL_INVOICE_ERROR',
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            await this.exportRepository.update(id, {
                isCompleted: -1,
            });
            const message = await this.messageService.getMessage('CANCEL_SUCCESS');
            return {
                message: message,
            };
        }
        catch (error) {
            if (error.response) {
                const message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                const message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
    async checkExist(id) {
        try {
            return await this.exportRepository.findOne({
                where: { id },
            });
        }
        catch (error) {
            let message;
            if (error.response) {
                message = await this.messageService.getMessage(error.response.messageCode);
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.BAD_REQUEST);
            }
            else {
                console.log(error);
                message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
                throw new common_1.HttpException({
                    message: message,
                }, common_1.HttpStatus.INTERNAL_SERVER_ERROR);
            }
        }
    }
};
exports.ExportService = ExportService;
__decorate([
    __param(0, (0, common_1.Query)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExportService.prototype, "findAll", null);
__decorate([
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_export_dto_1.CreateExportDto, Object]),
    __metadata("design:returntype", Promise)
], ExportService.prototype, "create", null);
exports.ExportService = ExportService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_2.InjectRepository)(export_entity_1.Export)),
    __param(1, (0, typeorm_2.InjectRepository)(ingredient_entity_1.Ingredient)),
    __param(2, (0, typeorm_2.InjectRepository)(recipe_entity_1.Recipe)),
    __param(3, (0, typeorm_2.InjectRepository)(export_ingredient_entity_1.ExportIngredient)),
    __metadata("design:paramtypes", [typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.Repository,
        typeorm_1.DataSource,
        lib_1.MessageService])
], ExportService);
//# sourceMappingURL=export.service.js.map