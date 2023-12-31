import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { InvoiceController } from './invoice.controller';
import { Invoice } from './entities/invoice.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvoiceProduct } from '../invoice_product/entities/invoice_product.entity';
import { Ingredient } from '../ingredient/entities/ingredient.entity';
import { CartProduct } from '../cart_product/entities/cart_product.entity';
import { User } from '../user/entities/user.entity';
import { Shop } from '../shop/entities/shop.entity';
import { Product } from '../product/entities/product.entity';
import { ShippingCompany } from '../shipping_company/entities/shipping_company.entity';
import { CheckExistInvoice } from '../common/middlewares/middlewares';
import {
  validateCheckOut,
  validateFromDateToDate,
} from '../common/middlewares/validate';
import { ShippingCompanyService } from '../shipping_company/shipping_company.service';
import { ExportService } from '../export/export.service';
import { Export } from '../export/entities/export.entity';
import { ExportIngredient } from '../export_ingredient/entities/export_ingredient.entity';
import { MessageService } from '../common/lib';
import { Recipe } from '../recipe/entities/recipe.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Invoice,
      InvoiceProduct,
      Ingredient,
      CartProduct,
      User,
      Shop,
      Product,
      ShippingCompany,
      Export,
      ExportIngredient,
      Recipe,
    ]),
  ],
  controllers: [InvoiceController],
  providers: [
    InvoiceService,
    ShippingCompanyService,
    ExportService,
    MessageService,
  ],
})
export class InvoiceModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(CheckExistInvoice)
      .exclude(
        { path: 'invoice/statistical', method: RequestMethod.GET },
        'invoice/checkout',
      )
      .forRoutes(
        { path: 'invoice/:id', method: RequestMethod.ALL },
        { path: 'invoice/.*/:id', method: RequestMethod.ALL },
      );
    consumer
      .apply(validateCheckOut)
      .forRoutes({ path: 'invoice/checkout', method: RequestMethod.POST });
    consumer
      .apply(validateFromDateToDate)
      .forRoutes(
        { path: 'invoice/statistical', method: RequestMethod.GET },
        { path: 'invoice', method: RequestMethod.GET },
      );
  }
}
