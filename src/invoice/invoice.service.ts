import {
  Injectable,
  Body,
  Ip,
  HttpException,
  Query,
  Request,
  HttpStatus,
} from '@nestjs/common';

import * as querystring from 'qs';
import vnpayConfig from '../../config/vnpayConfig';
import * as crypto from 'crypto';
import momentConfig = require('moment');
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { Invoice } from './entities/invoice.entity';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  In,
  LessThan,
  Like,
  Not,
  Repository,
} from 'typeorm';
import { InvoiceProduct } from '../invoice_product/entities/invoice_product.entity';
import { CartProduct } from '../cart_product/entities/cart_product.entity';
import { Ingredient } from '../ingredient/entities/ingredient.entity';
import { User } from '../user/entities/user.entity';
import { Shop } from '../shop/entities/shop.entity';
import { Product } from '../product/entities/product.entity';
import { ShippingCompany } from '../shipping_company/entities/shipping_company.entity';
import { MessageService } from '../common/lib';
import { Recipe } from '../recipe/entities/recipe.entity';

@Injectable()
export class InvoiceService {
  constructor(
    @InjectRepository(Invoice)
    readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Recipe)
    readonly recipeRepository: Repository<Recipe>,
    @InjectRepository(InvoiceProduct)
    readonly invoiceProductRepository: Repository<InvoiceProduct>,
    @InjectRepository(Ingredient)
    readonly ingredientRepository: Repository<Ingredient>,
    @InjectRepository(CartProduct)
    readonly cartProductRepository: Repository<CartProduct>,
    @InjectRepository(User)
    readonly userRepository: Repository<User>,
    @InjectRepository(Shop)
    readonly shopRepository: Repository<Shop>,
    @InjectRepository(Product)
    readonly productRepository: Repository<Product>,
    @InjectRepository(ShippingCompany)
    readonly shippingCompanyRepository: Repository<ShippingCompany>,
    @InjectDataSource() private dataSource: DataSource,
    private readonly messageService: MessageService,
  ) {}

  async handlePayment(@Body('id_order') id_order: number, @Ip() ip) {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: id_order,
        },
      });
      if (invoice) {
        if (invoice.isPaid != 0) {
          throw new HttpException(
            {
              messageCode: 'PAYMENT_ERROR',
            },
            HttpStatus.BAD_REQUEST,
          );
        } else if (invoice.status == 4) {
          throw new HttpException(
            {
              messageCode: 'PAYMENT_ERROR1',
            },
            HttpStatus.BAD_REQUEST,
          );
        } else {
          process.env.TZ = 'Asia/Ho_Chi_Minh';

          const date = new Date();
          const createDate = (momentConfig as any)(date).format(
            'YYYYMMDDHHmmss',
          );

          const ipAddr = ip;

          const tmnCode = vnpayConfig.vnp_TmnCode;
          const secretKey = vnpayConfig.vnp_HashSecret;
          let vnpUrl = vnpayConfig.vnp_Url;
          const returnUrl = vnpayConfig.vnp_ReturnUrl;
          const bankCode = 'NCB';
          const locale = 'vn';
          const currCode = 'VND';
          let vnp_Params = {};
          vnp_Params['vnp_Version'] = '2.1.0';
          vnp_Params['vnp_Command'] = 'pay';
          vnp_Params['vnp_TmnCode'] = tmnCode;
          vnp_Params['vnp_Locale'] = locale;
          vnp_Params['vnp_CurrCode'] = currCode;
          vnp_Params['vnp_TxnRef'] = id_order;
          vnp_Params['vnp_OrderInfo'] =
            'Thanh toán cho mã đơn hàng: ' + id_order;
          vnp_Params['vnp_OrderType'] = 'other';
          vnp_Params['vnp_Amount'] =
            (invoice.total + invoice.shippingFee) * 100000;
          vnp_Params['vnp_ReturnUrl'] = returnUrl;
          vnp_Params['vnp_IpAddr'] = ipAddr;
          vnp_Params['vnp_CreateDate'] = createDate;
          vnp_Params['vnp_BankCode'] = bankCode;
          // if (bankCode !== null && bankCode !== '') {
          //   vnp_Params['vnp_BankCode'] = bankCode;
          // }
          vnp_Params = this.sortObject(vnp_Params);

          const signData = querystring.stringify(vnp_Params, { encode: false });

          const hmac = crypto.createHmac('sha512', secretKey);
          const signed = hmac
            .update(new Buffer(signData, 'utf-8'))
            .digest('hex');
          vnp_Params['vnp_SecureHash'] = signed;
          vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

          return {
            data: vnpUrl,
          };
        }
      } else {
        throw new HttpException(
          {
            messageCode: 'PAYMENT_ERROR2',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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

  async handlePaymentReturn(@Query() vnp_Params: any) {
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    const id_order = vnp_Params.vnp_TxnRef;
    const amount = vnp_Params.vnp_Amount / 100;
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: id_order,
        },
      });
      if (
        invoice.isPaid == 0 &&
        amount == (invoice.total + invoice.shippingFee) * 1000
      ) {
        await this.invoiceRepository.update(invoice.id, {
          isPaid: 1,
        });
        const message = await this.messageService.getMessage('PAYMENT_SUCCESS');
        return {
          message: message,
        };
      } else {
        throw new HttpException(
          {
            messageCode: 'PAYMENT_ERROR3',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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

  async handleRefund(@Body('id_order') id_order: number, @Ip() ip) {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: id_order,
          isPaid: 1,
          paymentMethod: 'VNPAY',
          status: 0,
        },
      });
      if (invoice) {
        process.env.TZ = 'Asia/Ho_Chi_Minh';

        const date = new Date();
        const createDate = (momentConfig as any)(date).format('YYYYMMDDHHmmss');

        const ipAddr = ip;

        const tmnCode = vnpayConfig.vnp_TmnCode;
        const secretKey = vnpayConfig.vnp_HashSecret;
        let vnpUrl = vnpayConfig.vnp_Url;
        const returnUrl = vnpayConfig.vnp_RefundUrl;
        const bankCode = 'NCB';
        const locale = 'vn';
        const currCode = 'VND';
        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = locale;
        vnp_Params['vnp_CurrCode'] = currCode;
        vnp_Params['vnp_TxnRef'] = id_order;
        vnp_Params['vnp_OrderInfo'] = 'Hoàn tiền cho mã đơn hàng: ' + id_order;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] =
          (invoice.total + invoice.shippingFee) * 100000;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_BankCode'] = bankCode;
        // if (bankCode !== null && bankCode !== '') {
        //   vnp_Params['vnp_BankCode'] = bankCode;
        // }
        vnp_Params = this.sortObject(vnp_Params);

        const signData = querystring.stringify(vnp_Params, { encode: false });

        const hmac = crypto.createHmac('sha512', secretKey);
        const signed = hmac.update(new Buffer(signData, 'utf-8')).digest('hex');
        vnp_Params['vnp_SecureHash'] = signed;
        vnpUrl += '?' + querystring.stringify(vnp_Params, { encode: false });

        return {
          data: vnpUrl,
        };
      } else {
        throw new HttpException(
          {
            messageCode: 'PAYMENT_ERROR2',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
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

  async handleRefundReturn(@Query() vnp_Params: any) {
    delete vnp_Params['vnp_SecureHash'];
    delete vnp_Params['vnp_SecureHashType'];

    try {
      const message = await this.messageService.getMessage('REFUND_SUCCESS');
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

  sortObject(obj: { [key: string]: any }): { [key: string]: any } {
    const sorted: { [key: string]: any } = {};
    const str: string[] = [];
    let key: string;
    for (key in obj) {
      if (obj.hasOwnProperty(key)) {
        str.push(encodeURIComponent(key));
      }
    }
    str.sort();
    for (let i = 0; i < str.length; i++) {
      sorted[str[i]] = encodeURIComponent(obj[str[i]]).replace(/%20/g, '+');
    }
    return sorted;
  }

  async findAll(@Query() query, @Request() req): Promise<any> {
    const status = query.status;
    const fromDate = query.fromdate;
    const toDate = new Date(query.todate);
    toDate.setDate(toDate.getDate() + 1);
    toDate.setMinutes(toDate.getMinutes() - 1);
    let res = [];
    let total = 0;
    try {
      if (req.role == 0) {
        if (status) {
          if (fromDate && toDate) {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                status,
                user: Like(req.user.id),
                date: Between(fromDate, toDate),
              },
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          } else {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                user: Like(req.user.id),
                status,
              },
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          }
        } else {
          if (fromDate && toDate) {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                user: Like(req.user.id),
                date: Between(fromDate, toDate),
              },
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          } else {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                user: Like(req.user.id),
              },
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          }
        }
      } else {
        if (status) {
          if (fromDate && toDate) {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                status,
                date: Between(fromDate, toDate),
              },
              order: {
                date: 'ASC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          } else {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                status,
              },
              order: {
                date: 'ASC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          }
        } else {
          if (fromDate && toDate) {
            [res, total] = await this.invoiceRepository.findAndCount({
              where: {
                date: Between(fromDate, toDate),
              },
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          } else {
            [res, total] = await this.invoiceRepository.findAndCount({
              order: {
                date: 'DESC', // hoặc "DESC" để sắp xếp giảm dần
              },
              relations: [
                'invoice_products.product.product_recipes.recipe',
                'user.account',
                'shippingCompany',
              ],
            });
          }
        }
      }
      for (const invoice of res) {
        for (let i = 0; i < invoice.invoice_products.length; i++) {
          invoice.invoice_products[i].product.product_recipes.sort(
            (a, b) => b.isMain - a.isMain,
          );
        }
      }
      if (res) {
        const data = [
          {
            id: 0,
            shippingFee: 0,
            total: 0,
            date: '',
            status: 0,
            address: '',
            phone: '',
            description: '',
            paymentMethod: '',
            isPaid: 0,
            shippingCompany: {},
            products: [
              {
                quantity: 0,
                price: 0,
                size: 0,
                name: '',
                image: '',
                toppings: [
                  {
                    name: '',
                    image: '',
                    price: 0,
                  },
                ],
              },
            ],
          },
        ];
        for (let k = 0; k < res.length; k++) {
          data[k] = {
            id: res[k].id,
            shippingFee: res[k].shippingFee,
            total: res[k].total,
            date: res[k].date,
            status: res[k].status,
            address: res[k].address,
            phone: res[k].phone,
            description: res[k].description,
            paymentMethod: res[k].paymentMethod,
            isPaid: res[k].isPaid,
            shippingCompany: res[k].shippingCompany,
            products: [],
          };
          for (let g = 0; g < res[k].invoice_products.length; g++) {
            for (let i = 0; i < res[k].invoice_products.length; i++) {
              data[k].products[i] = {
                quantity: res[k].invoice_products[i].quantity,
                size: res[k].invoice_products[i].size,
                price: res[k].invoice_products[i].price,
                name: res[k].invoice_products[i].product.product_recipes[0]
                  .recipe.name,
                image:
                  res[k].invoice_products[i].product.product_recipes[0].recipe
                    .image,
                toppings: [],
              };
            }
            for (
              let j = 1;
              j < res[k].invoice_products[g].product.product_recipes.length;
              j++
            ) {
              data[k].products[g].toppings[j - 1] = {
                name: res[k].invoice_products[g].product.product_recipes[j]
                  .recipe.name,
                image:
                  res[k].invoice_products[g].product.product_recipes[j].recipe
                    .image,
                price:
                  res[k].invoice_products[g].product.product_recipes[j].recipe
                    .price,
              };
            }
          }
        }
        if (data[0].id) {
          return {
            data: data,
          };
        }
      }
      return {
        data: null,
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

  async thongKe(@Query() query): Promise<any> {
    const fromDate = query.fromdate;
    const toDate = new Date(query.todate);
    toDate.setDate(toDate.getDate() + 1);
    let invoices = [];
    let revenue = 0;
    let countRecipes = 0;
    let countToppings = 0;
    let countInvoices = 0;
    const recipeCounts = {};
    const toppingCounts = {};
    try {
      if (fromDate && toDate) {
        [invoices, countInvoices] = await this.invoiceRepository.findAndCount({
          where: {
            date: Between(fromDate, toDate),
            status: 3,
          },
          relations: ['invoice_products.product.product_recipes.recipe'],
        });
      } else {
        [invoices, countInvoices] = await this.invoiceRepository.findAndCount({
          where: {
            status: 3,
          },
          relations: ['invoice_products.product.product_recipes.recipe'],
        });
      }
      for (const invoice of invoices) {
        for (const invoiceProduct of invoice.invoice_products) {
          countRecipes += invoiceProduct.quantity;
          for (const productRecipe of invoiceProduct.product.product_recipes) {
            const name = productRecipe.recipe.name;
            const id = productRecipe.recipe.id;
            const image = productRecipe.recipe.image;
            const quantityProduct = invoiceProduct.quantity;
            if (productRecipe.isMain == 1) {
              if (recipeCounts[id]) {
                recipeCounts[id].count += quantityProduct;
              } else {
                recipeCounts[id] = {
                  count: quantityProduct,
                  name: name,
                  image: image,
                };
              }
            } else {
              countToppings += invoiceProduct.quantity;
              if (toppingCounts[id]) {
                toppingCounts[id].count += quantityProduct;
              } else {
                toppingCounts[id] = {
                  count: quantityProduct,
                  name: name,
                  image: image,
                };
              }
            }
          }
        }
        revenue += invoice.total;
      }
      const count = await this.dataSource.query(
        `SELECT COUNT(userId)/COUNT(id)*100 as percent FROM invoice WHERE status = 3 GROUP BY userId HAVING COUNT(userId) >= 2`,
      );

      const topNames = Object.values(recipeCounts);
      const topToppings = Object.values(toppingCounts);

      const totalImport = await this.dataSource.query(
        `SELECT 
    COALESCE(SUM(CASE WHEN MONTH(date) = 1 THEN total ELSE 0 END), 0) AS 'Jan',
    COALESCE(SUM(CASE WHEN MONTH(date) = 2 THEN total ELSE 0 END), 0) AS 'Feb',
    COALESCE(SUM(CASE WHEN MONTH(date) = 3 THEN total ELSE 0 END), 0) AS 'Mar',
    COALESCE(SUM(CASE WHEN MONTH(date) = 4 THEN total ELSE 0 END), 0) AS 'Apr',
    COALESCE(SUM(CASE WHEN MONTH(date) = 5 THEN total ELSE 0 END), 0) AS 'May',
    COALESCE(SUM(CASE WHEN MONTH(date) = 6 THEN total ELSE 0 END), 0) AS 'Jun',
    COALESCE(SUM(CASE WHEN MONTH(date) = 7 THEN total ELSE 0 END), 0) AS 'Jul',
    COALESCE(SUM(CASE WHEN MONTH(date) = 8 THEN total ELSE 0 END), 0) AS 'Aug',
    COALESCE(SUM(CASE WHEN MONTH(date) = 9 THEN total ELSE 0 END), 0) AS 'Sep',
    COALESCE(SUM(CASE WHEN MONTH(date) = 10 THEN total ELSE 0 END), 0) AS 'Oct',
    COALESCE(SUM(CASE WHEN MONTH(date) = 11 THEN total ELSE 0 END), 0) AS 'Nov',
    COALESCE(SUM(CASE WHEN MONTH(date) = 12 THEN total ELSE 0 END), 0) AS 'Dec'
FROM import
WHERE YEAR(date) = YEAR(CURDATE())`,
      );
      const totalRevenue = await this.dataSource.query(
        `SELECT 
    COALESCE(SUM(CASE WHEN MONTH(date) = 1 THEN total ELSE 0 END), 0) AS 'Jan',
    COALESCE(SUM(CASE WHEN MONTH(date) = 2 THEN total ELSE 0 END), 0) AS 'Feb',
    COALESCE(SUM(CASE WHEN MONTH(date) = 3 THEN total ELSE 0 END), 0) AS 'Mar',
    COALESCE(SUM(CASE WHEN MONTH(date) = 4 THEN total ELSE 0 END), 0) AS 'Apr',
    COALESCE(SUM(CASE WHEN MONTH(date) = 5 THEN total ELSE 0 END), 0) AS 'May',
    COALESCE(SUM(CASE WHEN MONTH(date) = 6 THEN total ELSE 0 END), 0) AS 'Jun',
    COALESCE(SUM(CASE WHEN MONTH(date) = 7 THEN total ELSE 0 END), 0) AS 'Jul',
    COALESCE(SUM(CASE WHEN MONTH(date) = 8 THEN total ELSE 0 END), 0) AS 'Aug',
    COALESCE(SUM(CASE WHEN MONTH(date) = 9 THEN total ELSE 0 END), 0) AS 'Sep',
    COALESCE(SUM(CASE WHEN MONTH(date) = 10 THEN total ELSE 0 END), 0) AS 'Oct',
    COALESCE(SUM(CASE WHEN MONTH(date) = 11 THEN total ELSE 0 END), 0) AS 'Nov',
    COALESCE(SUM(CASE WHEN MONTH(date) = 12 THEN total ELSE 0 END), 0) AS 'Dec'
FROM invoice
WHERE YEAR(date) = YEAR(CURDATE())`,
      );
      const totalExport = await this.dataSource.query(
        `SELECT 
    COALESCE(SUM(CASE WHEN MONTH(date) = 1 THEN total ELSE 0 END), 0) AS 'Jan',
    COALESCE(SUM(CASE WHEN MONTH(date) = 2 THEN total ELSE 0 END), 0) AS 'Feb',
    COALESCE(SUM(CASE WHEN MONTH(date) = 3 THEN total ELSE 0 END), 0) AS 'Mar',
    COALESCE(SUM(CASE WHEN MONTH(date) = 4 THEN total ELSE 0 END), 0) AS 'Apr',
    COALESCE(SUM(CASE WHEN MONTH(date) = 5 THEN total ELSE 0 END), 0) AS 'May',
    COALESCE(SUM(CASE WHEN MONTH(date) = 6 THEN total ELSE 0 END), 0) AS 'Jun',
    COALESCE(SUM(CASE WHEN MONTH(date) = 7 THEN total ELSE 0 END), 0) AS 'Jul',
    COALESCE(SUM(CASE WHEN MONTH(date) = 8 THEN total ELSE 0 END), 0) AS 'Aug',
    COALESCE(SUM(CASE WHEN MONTH(date) = 9 THEN total ELSE 0 END), 0) AS 'Sep',
    COALESCE(SUM(CASE WHEN MONTH(date) = 10 THEN total ELSE 0 END), 0) AS 'Oct',
    COALESCE(SUM(CASE WHEN MONTH(date) = 11 THEN total ELSE 0 END), 0) AS 'Nov',
    COALESCE(SUM(CASE WHEN MONTH(date) = 12 THEN total ELSE 0 END), 0) AS 'Dec'
FROM export
WHERE YEAR(date) = YEAR(CURDATE());`,
      );
      const date = new Date(toDate);
      const year = date.getFullYear();
      const month = ('0' + (date.getMonth() + 1)).slice(-2);
      const day = ('0' + date.getDate()).slice(-2);
      const formattedDate = `${year}-${month}-${day}`;
      const importExportIngredients = await this.dataSource.query(
        `SELECT I.*, (SELECT IFNULL(SUM(quantity), 0) FROM import_ingredient, import WHERE import.id = import_ingredient.importId AND import_ingredient.ingredientId = I.id AND import.date between '${fromDate}' AND '${formattedDate}') as total_import, (SELECT IFNULL(SUM(quantity), 0) FROM export_ingredient, export WHERE export.id = export_ingredient.exportId AND export_ingredient.ingredientId = I.id AND export.date between '${fromDate}' AND '${formattedDate}') as total_export FROM ingredient as I`,
      );
      return {
        totalExport: totalExport[0]
          ? [
              totalExport[0].Jan,
              totalExport[0].Feb,
              totalExport[0].Mar,
              totalExport[0].Apr,
              totalExport[0].May,
              totalExport[0].Jun,
              totalExport[0].Jul,
              totalExport[0].Aug,
              totalExport[0].Sep,
              totalExport[0].Oct,
              totalExport[0].Nov,
              totalExport[0].Dec,
            ]
          : null,
        totalImport: totalImport[0]
          ? [
              totalImport[0].Jan,
              totalImport[0].Feb,
              totalImport[0].Mar,
              totalImport[0].Apr,
              totalImport[0].May,
              totalImport[0].Jun,
              totalImport[0].Jul,
              totalImport[0].Aug,
              totalImport[0].Sep,
              totalImport[0].Oct,
              totalImport[0].Nov,
              totalImport[0].Dec,
            ]
          : null,
        totalRevenue: totalRevenue[0]
          ? [
              totalRevenue[0].Jan,
              totalRevenue[0].Feb,
              totalRevenue[0].Mar,
              totalRevenue[0].Apr,
              totalRevenue[0].May,
              totalRevenue[0].Jun,
              totalRevenue[0].Jul,
              totalRevenue[0].Aug,
              totalRevenue[0].Sep,
              totalRevenue[0].Oct,
              totalRevenue[0].Nov,
              totalRevenue[0].Dec,
            ]
          : null,
        importExportIngredients: importExportIngredients,
        percentCusReOrder: count[0] ? Number(count[0].percent) : null,
        topNames: topNames,
        topToppings: topToppings,
        revenue: revenue,
        countToppings: countToppings,
        countRecipes: countRecipes,
        countInvoices: countInvoices,
      };
    } catch (error) {
      let message;
      console.log(error);
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
      const res = await this.invoiceRepository
        .createQueryBuilder('invoice')
        .leftJoinAndSelect('invoice.user', 'user')
        .leftJoinAndSelect('invoice.staff', 'staff')
        .leftJoinAndSelect('invoice.invoice_products', 'invoice_products')
        .leftJoinAndSelect('invoice_products.product', 'product')
        .leftJoinAndSelect('product.product_recipes', 'product_recipes')
        .leftJoinAndSelect('product_recipes.recipe', 'recipe')
        .leftJoinAndSelect('user.account', 'account')
        .select([
          'invoice',
          'user',
          'account',
          'account.phone',
          'invoice_products',
          'product',
          'product_recipes',
          'recipe',
        ])
        .orderBy('product_recipes.isMain', 'DESC')
        .where('invoice.id = :id', { id: id })
        .getOne();
      if (res) {
        const data = {
          invoice: {},
          user: {
            phone: '',
            name: '',
            address: '',
          },
          products: [
            {
              quantity: 0,
              price: 0,
              size: 0,
              name: '',
              image: '',
              toppings: [
                {
                  name: '',
                  image: '',
                  price: 0,
                },
              ],
            },
          ],
        };
        data.user.name = res.user.name;
        data.user.address = res.user.address;
        data.user.phone = res.user.account.phone;
        delete res.user;
        data.invoice = res;
        for (let g = 0; g < res.invoice_products.length; g++) {
          for (let i = 0; i < res.invoice_products.length; i++) {
            data.products[i] = {
              quantity: res.invoice_products[i].quantity,
              size: res.invoice_products[i].size,
              price: res.invoice_products[i].price,
              name: res.invoice_products[i].product.product_recipes[0].recipe
                .name,
              image:
                res.invoice_products[i].product.product_recipes[0].recipe.image,
              toppings: [],
            };
          }
          for (
            let j = 1;
            j < res.invoice_products[g].product.product_recipes.length;
            j++
          ) {
            data.products[g].toppings[j - 1] = {
              name: res.invoice_products[g].product.product_recipes[j].recipe
                .name,
              image:
                res.invoice_products[g].product.product_recipes[j].recipe.image,
              price:
                res.invoice_products[g].product.product_recipes[j].recipe.price,
            };
          }
        }
        delete res.invoice_products;
        return {
          data: data,
        };
      }
      return {
        data: null,
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

  async getCurrentInvoice(@Request() req) {
    try {
      const res = await this.invoiceRepository.findOne({
        where: {
          status: LessThan(3),
          user: {
            id: req.user.id,
          },
        },
        relations: [
          'shippingCompany',
          'user.account',
          'invoice_products.product.product_recipes.recipe',
        ],
      });
      if (res) {
        const data = {
          invoice: {
            id: 0,
            total: 0,
            shippingFee: 0,
            date: '',
            status: 0,
            paymentMethod: '',
            description: '',
            isPaid: 1,
            shippingCompany: {},
          },
          user: {
            phone: '',
            name: '',
            address: '',
          },
          products: [
            {
              quantity: 0,
              size: 0,
              name: '',
              image: '',
              toppings: [
                {
                  name: '',
                  image: '',
                  price: 0,
                },
              ],
            },
          ],
        };
        data.user.name = res.user.name;
        data.user.address = res.user.address;
        data.user.phone = res.user.account.phone;
        delete res.user;
        data.invoice.shippingCompany = res.shippingCompany;
        data.invoice.id = res.id;
        data.invoice.total = res.total;
        data.invoice.shippingFee = res.shippingFee;
        data.invoice.date = res.date.toString();
        data.invoice.status = res.status;
        data.invoice.isPaid = res.isPaid;
        data.invoice.description = res.description;
        data.invoice.paymentMethod = res.paymentMethod;
        for (let i = 0; i < res.invoice_products.length; i++) {
          for (let i = 0; i < res.invoice_products.length; i++) {
            data.products[i] = {
              quantity: res.invoice_products[i].quantity,
              size: res.invoice_products[i].size,
              name: res.invoice_products[i].product.product_recipes[0].recipe
                .name,
              image:
                res.invoice_products[i].product.product_recipes[0].recipe.image,
              toppings: [],
            };
          }
          for (
            let j = 1;
            j < res.invoice_products[i].product.product_recipes.length;
            j++
          ) {
            data.products[i].toppings[j - 1] = {
              name: res.invoice_products[i].product.product_recipes[j].recipe
                .name,
              image:
                res.invoice_products[i].product.product_recipes[j].recipe.image,
              price:
                res.invoice_products[i].product.product_recipes[j].recipe.price,
            };
          }
        }
        delete res.invoice_products;
        return {
          data: data,
        };
      }
      return {
        data: res,
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

  async checkout(item: CreateInvoiceDto, @Request() req) {
    item.status = 0;
    item.isPaid = 0;
    item.total = 0;
    const date = new Date();
    date.setHours(date.getHours() + 7);
    item.date = date;
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const checkCreate = await transactionalEntityManager
            .getRepository(Invoice)
            .findOne({
              where: {
                user: Like(req.user.id),
                status: Not(In([3, 4])),
              },
            });
          if (!checkCreate) {
            const cartProducts = await transactionalEntityManager
              .getRepository(CartProduct)
              .find({
                where: {
                  user: Like(req.user.id),
                },
                relations: [
                  'user',
                  'product.product_recipes.recipe.recipe_ingredients.ingredient',
                ],
              });
            if (!cartProducts[0]) {
              throw new HttpException(
                {
                  messageCode: 'CHECKOUT_ERROR2',
                },
                HttpStatus.BAD_REQUEST,
              );
            }
            for (const cartProduct of cartProducts) {
              for (const productRecipe of cartProduct.product.product_recipes) {
                if (productRecipe.recipe.isActive == 0) {
                  throw new HttpException(
                    {
                      messageCode: 'CHECKOUT_ERROR',
                      name: cartProduct.product.product_recipes[0].recipe.name,
                      cartProductId: cartProduct.id,
                    },
                    HttpStatus.BAD_REQUEST,
                  );
                }
                for (const recipeIngredient of productRecipe.recipe
                  .recipe_ingredients) {
                  const decreQuantity =
                    recipeIngredient.quantity * cartProduct.quantity;
                  const ingredient = await transactionalEntityManager
                    .getRepository(Ingredient)
                    .findOne({
                      where: {
                        id: recipeIngredient.ingredient.id,
                      },
                    });
                  if (decreQuantity > ingredient.quantity) {
                    throw new HttpException(
                      {
                        messageCode: 'QUANTITY_NOTENOUGH_ERROR',
                        id: productRecipe.recipe.id,
                        cartProductId: cartProduct.id,
                        name: cartProduct.product.product_recipes[0].recipe
                          .name,
                      },
                      HttpStatus.BAD_REQUEST,
                    );
                  }
                }
              }
            }
            const shippingCompany = await transactionalEntityManager
              .getRepository(ShippingCompany)
              .findOne({
                where: {
                  id: item.shippingCompanyId,
                },
              });
            const user = await transactionalEntityManager
              .getRepository(User)
              .findOne({
                where: {
                  id: req.user.id,
                },
              });
            const invoice = await transactionalEntityManager
              .getRepository(Invoice)
              .save({
                ...item,
                user,
                shippingCompany,
              });
            const shop = await transactionalEntityManager
              .getRepository(Shop)
              .find({});
            let total = 0;
            for (const cartProduct of cartProducts) {
              let price = 0;
              for (const productRecipe of cartProduct.product.product_recipes) {
                total +=
                  (cartProduct.quantity *
                    productRecipe.recipe.price *
                    productRecipe.recipe.discount) /
                  100;
                price +=
                  (cartProduct.quantity *
                    productRecipe.recipe.price *
                    productRecipe.recipe.discount) /
                  100;
              }
              const product = await transactionalEntityManager
                .getRepository(Product)
                .findOne({
                  where: {
                    id: cartProduct.product.id,
                  },
                });
              if (cartProduct.size != 0) {
                await transactionalEntityManager
                  .getRepository(InvoiceProduct)
                  .save({
                    size: cartProduct.size,
                    quantity: cartProduct.quantity,
                    price: price + shop[0].upSizePrice,
                    invoice: invoice,
                    product: product,
                    isReviewed: 0,
                  });
              } else {
                await transactionalEntityManager
                  .getRepository(InvoiceProduct)
                  .save({
                    size: 0,
                    quantity: cartProduct.quantity,
                    price: price,
                    invoice: invoice,
                    product: product,
                    isReviewed: 0,
                  });
              }
              await transactionalEntityManager
                .getRepository(CartProduct)
                .delete(cartProduct.id);
              if (cartProduct.size != 0) {
                total += shop[0].upSizePrice * cartProduct.quantity;
              }
            }
            await transactionalEntityManager
              .getRepository(Invoice)
              .update(invoice.id, { total: total });
            const message =
              await this.messageService.getMessage('CHECKOUT_SUCCESS');
            return {
              data: invoice,
              message: message,
            };
          } else {
            throw new HttpException(
              {
                messageCode: 'CHECKOUT_ERROR1',
              },
              HttpStatus.BAD_REQUEST,
            );
          }
        } catch (error) {
          let message = '';
          if (error.response) {
            message = await this.messageService.getMessage(
              error.response.messageCode,
            );
            if (error.response.id) {
              await this.recipeRepository.update(error.response.id, {
                isActive: 2,
              });
            }
            if (error.response.cartProductId) {
              await this.cartProductRepository.delete({
                id: error.response.cartProductId,
              });
            }
            if (error.response.name) {
              const message2 =
                await this.messageService.getMessage('DELETE_FROM_CART');
              throw new HttpException(
                {
                  message: message + `(${error.response.name}). ${message2}`,
                },
                HttpStatus.BAD_REQUEST,
              );
            }
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
      },
    );
  }

  async confirmInvoice(id: number, @Request() req) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const invoiceProducts = await transactionalEntityManager
            .getRepository(InvoiceProduct)
            .find({
              where: {
                invoice: Like(id),
              },
              relations: [
                'product.product_recipes.recipe.recipe_ingredients.ingredient',
              ],
            });
          for (const invoiceProduct of invoiceProducts) {
            for (const productRecipe of invoiceProduct.product
              .product_recipes) {
              for (const recipeIngredient of productRecipe.recipe
                .recipe_ingredients) {
                const decreQuantity =
                  recipeIngredient.quantity * invoiceProduct.quantity;
                const ingredient = await transactionalEntityManager
                  .getRepository(Ingredient)
                  .findOne({
                    where: {
                      id: recipeIngredient.ingredient.id,
                    },
                  });
                if (decreQuantity > ingredient.quantity) {
                  throw new HttpException(
                    {
                      messageCode: 'QUANTITY_NOTENOUGH_ERROR',
                    },
                    HttpStatus.BAD_REQUEST,
                  );
                }
                await transactionalEntityManager
                  .getRepository(Ingredient)
                  .decrement(
                    { id: recipeIngredient.ingredient.id },
                    'quantity',
                    decreQuantity,
                  );
              }
            }
          }
          await transactionalEntityManager.getRepository(Invoice).update(id, {
            status: 1,
            staff: req.user.id,
          });

          const message =
            await this.messageService.getMessage('CONFIRM_SUCCESS');
          return {
            message: message,
          };
        } catch (error) {
          let message = '';
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
      },
    );
  }

  async cancelInvoice(id: number, @Request() req) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const invoice = await transactionalEntityManager
            .getRepository(Invoice)
            .findOne({
              where: {
                id: id,
              },
            });
          if (req.role == 0) {
            if (invoice.status == 0) {
              await transactionalEntityManager
                .getRepository(Invoice)
                .update(id, {
                  status: 4,
                });
            } else {
              throw new HttpException(
                {
                  messageCode: 'CANCEL_INVOICE_ERROR',
                },
                HttpStatus.BAD_REQUEST,
              );
            }
          }
          if (req.role != 0) {
            if (invoice.status == 0) {
              await transactionalEntityManager
                .getRepository(Invoice)
                .update(id, {
                  status: 4,
                });
            }
            if (invoice.status != 4 && invoice.status != 3) {
              const invoiceProducts = await transactionalEntityManager
                .getRepository(InvoiceProduct)
                .find({
                  where: {
                    invoice: Like(id),
                  },
                  relations: [
                    'product.product_recipes.recipe.recipe_ingredients.ingredient',
                  ],
                });
              for (const invoiceProduct of invoiceProducts) {
                for (const productRecipe of invoiceProduct.product
                  .product_recipes) {
                  for (const recipeIngredient of productRecipe.recipe
                    .recipe_ingredients) {
                    const decreQuantity =
                      recipeIngredient.quantity * invoiceProduct.quantity;
                    await transactionalEntityManager
                      .getRepository(Ingredient)
                      .increment(
                        { id: recipeIngredient.ingredient.id },
                        'quantity',
                        decreQuantity,
                      );
                  }
                }
              }
              await transactionalEntityManager
                .getRepository(Invoice)
                .update(id, {
                  status: 4,
                });
            } else {
              throw new HttpException(
                {
                  messageCode: 'CANCEL_INVOICE_ERROR',
                },
                HttpStatus.BAD_REQUEST,
              );
            }
          }
          const message =
            await this.messageService.getMessage('CANCEL_SUCCESS');
          return {
            message: message,
          };
        } catch (error) {
          let message = '';
          console.log(error);
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
      },
    );
  }

  async receiveInvoice(id: number) {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: id,
        },
      });
      if (invoice.status == 1) {
        await this.invoiceRepository.update(id, {
          status: 2,
        });
        const message = await this.messageService.getMessage('RECEIVE_SUCCESS');
        return {
          message: message,
        };
      } else {
        throw new HttpException(
          {
            messageCode: 'RECEIVE_INVOICE_ERROR',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      let message = '';
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
      } else {
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
      }
      throw new HttpException(
        {
          message: message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async completeInvoice(id: number) {
    try {
      const invoice = await this.invoiceRepository.findOne({
        where: {
          id: id,
        },
      });
      if (invoice.status == 2) {
        await this.invoiceRepository.update(id, {
          status: 3,
          isPaid: 1,
        });
        const message =
          await this.messageService.getMessage('COMPLETE_SUCCESS');
        return {
          message: message,
        };
      } else {
        throw new HttpException(
          {
            messageCode: 'COMPLETE_INVOICE_ERROR',
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        );
      }
    } catch (error) {
      let message = '';
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
      } else {
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
      }
      throw new HttpException(
        {
          message: message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async prepareInvoice(id: number) {
    try {
      // const invoice = await this.invoiceRepository.findOne({
      //   where: {
      //     id: id,
      //   },
      // });
      // if (invoice.status == 1) {
      //   await this.invoiceRepository.update(id, {
      //     isPrepared: 1,
      //   });
      //   const message =
      //     await this.messageService.getMessage('PREPARED_SUCCESS');
      //   return {
      //     message: message,
      //   };
      // } else {
      //   throw new HttpException(
      //     {
      //       messageCode: 'PREPARED_INVOICE_ERROR',
      //     },
      //     HttpStatus.INTERNAL_SERVER_ERROR,
      //   );
      // }
    } catch (error) {
      let message = '';
      if (error.response) {
        message = await this.messageService.getMessage(
          error.response.messageCode,
        );
      } else {
        message = await this.messageService.getMessage('INTERNAL_SERVER_ERROR');
      }
      throw new HttpException(
        {
          message: message,
        },
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async checkExist(id: number): Promise<any> {
    try {
      return await this.invoiceRepository.findOne({
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
  async handleAutoDeleteInvoice(): Promise<any> {
    try {
      const now = new Date();
      now.setHours(now.getHours() + 8);
      const unPaidInvoices = await this.invoiceRepository.find({
        where: {
          isPaid: 0,
          paymentMethod: 'VNPAY',
          date: LessThan(now),
        },
      });
      if (unPaidInvoices.length) {
        for (const unPaidInvoice of unPaidInvoices) {
          const invoiceProducts = await this.invoiceProductRepository.find({
            where: {
              invoice: Like(unPaidInvoice.id),
            },
          });
          for (const invoiceProduct of invoiceProducts) {
            await this.invoiceProductRepository.delete(invoiceProduct.id);
          }
          await this.invoiceRepository.delete(unPaidInvoice.id);
        }
      }
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
