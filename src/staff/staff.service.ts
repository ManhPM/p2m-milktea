import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { CreateStaffDto } from './dto/create-staff.dto';
import { UpdateStaffDto } from './dto/update-staff.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Staff } from './entities/staff.entity';
import { DataSource, Like, Not, Repository, getConnection } from 'typeorm';
import { Account } from '../account/entities/account.entity';
import { MessageService } from '../common/lib';

@Injectable()
export class StaffService {
  constructor(
    @InjectRepository(Staff)
    readonly staffRepository: Repository<Staff>,
    @InjectRepository(Account)
    readonly accountRepository: Repository<Account>,
    private dataSource: DataSource,
    private readonly messageService: MessageService,
  ) {}
  async create(item: CreateStaffDto) {
    try {
      const salt = bcrypt.genSaltSync(10);
      const hashPassword = await bcrypt.hash(item.password, salt);
      item.password = hashPassword;
      item.isActive = 1;
      item.role = 1;
      const account = await this.accountRepository.save({
        ...item,
      });
      await this.staffRepository.save({
        ...item,
        account,
      });
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

  async checkExist(id: number): Promise<any> {
    try {
      return await this.staffRepository.findOne({
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

  async findAll(): Promise<any> {
    try {
      const res = await this.staffRepository.find({
        relations: ['account'],
        select: {
          account: {
            phone: true,
            role: true,
          },
        },
      });
      if (res[0]) {
        const data = [
          {
            id: 0,
            name: '',
            phone: '',
            role: 0,
            isActive: 0,
          },
        ];
        for (let i = 0; i < res.length; i++) {
          data[i] = {
            id: res[i].id,
            name: res[i].name,
            phone: res[i].account.phone,
            role: res[i].account.role,
            isActive: res[i].isActive,
          };
        }
        return {
          data: data,
        };
      }
      return {
        data: null,
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

  async findOne(id: number) {
    try {
      const res = await this.staffRepository.findOne({
        where: {
          id: id,
        },
        relations: ['account'],
      });
      delete res.account.password;
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

  async update(id: number, item: UpdateStaffDto) {
    return await this.dataSource.transaction(
      async (transactionalEntityManager) => {
        try {
          const staff = await transactionalEntityManager
            .getRepository(Staff)
            .findOne({
              where: {
                id: id,
              },
              relations: ['account'],
            });
          await transactionalEntityManager.update(Staff, id, {
            name: item.name,
            isActive: item.isActive,
            account: staff.account,
          });
          if (item.phone || item.password || item.role) {
            if (item.password) {
              const salt = bcrypt.genSaltSync(10);
              const hashPassword = await bcrypt.hash(item.password, salt);
              item.password = hashPassword;
            }
            await transactionalEntityManager.update(Account, staff.account.id, {
              password: item.password,
              phone: item.phone,
              role: item.role,
            });
          }

          const message =
            await this.messageService.getMessage('UPDATE_SUCCESS');
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

  async remove(id: number) {
    try {
      await this.staffRepository.update(id, {
        isActive: 0,
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
}
