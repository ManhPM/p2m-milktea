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
Object.defineProperty(exports, "__esModule", { value: true });
exports.Product = void 0;
const cart_product_entity_1 = require("../../cart_product/entities/cart_product.entity");
const invoice_product_entity_1 = require("../../invoice_product/entities/invoice_product.entity");
const product_recipe_entity_1 = require("../../product_recipe/entities/product_recipe.entity");
const typeorm_1 = require("typeorm");
let Product = class Product {
};
exports.Product = Product;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)(),
    __metadata("design:type", Number)
], Product.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", Number)
], Product.prototype, "size", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Product.prototype, "productString", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => cart_product_entity_1.CartProduct, (item) => item.product),
    __metadata("design:type", Array)
], Product.prototype, "cart_products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => invoice_product_entity_1.InvoiceProduct, (item) => item.product),
    __metadata("design:type", Array)
], Product.prototype, "invoice_products", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => product_recipe_entity_1.ProductRecipe, (item) => item.product),
    __metadata("design:type", Array)
], Product.prototype, "product_recipes", void 0);
exports.Product = Product = __decorate([
    (0, typeorm_1.Entity)()
], Product);
//# sourceMappingURL=product.entity.js.map