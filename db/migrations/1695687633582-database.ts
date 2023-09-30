import { MigrationInterface, QueryRunner } from "typeorm";

export class Database1695687633582 implements MigrationInterface {
    name = 'Database1695687633582'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`account\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(255) NOT NULL, \`phone\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` int NOT NULL, \`forgot\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shipping_company\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`costPerKm\` int NOT NULL, \`image\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`import\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` datetime NOT NULL, \`isCompleted\` int NOT NULL, \`description\` varchar(255) NOT NULL, \`staffId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`import_ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL, \`unitPrice\` int NOT NULL, \`importId\` int NULL, \`ingredientId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`recipe_type\` (\`id\` int NOT NULL AUTO_INCREMENT, \`recipeId\` int NULL, \`typeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`recipe\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`info\` varchar(255) NOT NULL, \`image\` varchar(255) NOT NULL, \`isACtive\` int NOT NULL, \`price\` int NOT NULL, \`discount\` int NOT NULL, \`typeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`recipe_ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL, \`recipeId\` int NULL, \`ingredientId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`unitName\` varchar(255) NOT NULL, \`image\` varchar(255) NOT NULL, \`isActive\` int NOT NULL, \`quantity\` int NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`export_ingredient\` (\`id\` int NOT NULL AUTO_INCREMENT, \`quantity\` int NOT NULL, \`exportId\` int NULL, \`ingredientId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`export\` (\`id\` int NOT NULL AUTO_INCREMENT, \`date\` datetime NOT NULL, \`isCompleted\` int NOT NULL, \`description\` varchar(255) NOT NULL, \`staffId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`staff\` (\`id\` int NOT NULL AUTO_INCREMENT, \`phone\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`gender\` varchar(255) NOT NULL, \`birthday\` datetime NOT NULL, \`hiredate\` datetime NOT NULL, \`accountId\` int NULL, UNIQUE INDEX \`REL_0c22265b9f67020e4618c1bd4c\` (\`accountId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`review\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NULL, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`wishlist\` (\`id\` int NOT NULL AUTO_INCREMENT, \`userId\` int NULL, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`user\` (\`id\` int NOT NULL AUTO_INCREMENT, \`name\` varchar(255) NOT NULL, \`address\` varchar(255) NOT NULL, \`photo\` varchar(255) NOT NULL, \`accountId\` int NULL, UNIQUE INDEX \`REL_68d3c22dbd95449360fdbf7a3f\` (\`accountId\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice\` (\`id\` int NOT NULL AUTO_INCREMENT, \`address\` varchar(255) NOT NULL, \`shippingFee\` int NOT NULL, \`date\` datetime NOT NULL, \`status\` int NOT NULL, \`isPaid\` int NOT NULL, \`userId\` int NULL, \`staffId\` int NULL, \`shippingCompanyId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`invoice_product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`size\` int NOT NULL, \`quantity\` int NOT NULL, \`price\` int NOT NULL, \`invoiceId\` int NULL, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`productString\` varchar(255) NOT NULL, \`isMain\` int NOT NULL, \`recipeId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`cart_product\` (\`id\` int NOT NULL AUTO_INCREMENT, \`size\` int NOT NULL, \`quantity\` int NOT NULL, \`userId\` int NULL, \`productId\` int NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`shop\` (\`id\` int NOT NULL AUTO_INCREMENT, \`address\` varchar(255) NOT NULL, \`isActive\` int NOT NULL, \`latitude\` int NOT NULL, \`longitude\` int NOT NULL, \`image\` varchar(255) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`import\` ADD CONSTRAINT \`FK_8a114d142f38f0a89a9018c1917\` FOREIGN KEY (\`staffId\`) REFERENCES \`staff\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`import_ingredient\` ADD CONSTRAINT \`FK_ce556cae25e9138de4af92c33b0\` FOREIGN KEY (\`importId\`) REFERENCES \`import\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`import_ingredient\` ADD CONSTRAINT \`FK_cf152e99115cd6a0f047d6f36ae\` FOREIGN KEY (\`ingredientId\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipe_type\` ADD CONSTRAINT \`FK_9484c929161461b271880853ce1\` FOREIGN KEY (\`recipeId\`) REFERENCES \`recipe\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipe_type\` ADD CONSTRAINT \`FK_dfa26051c6f125205d14a46cd53\` FOREIGN KEY (\`typeId\`) REFERENCES \`type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipe\` ADD CONSTRAINT \`FK_9cea7f656930bb93c13a6b8fadd\` FOREIGN KEY (\`typeId\`) REFERENCES \`type\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipe_ingredient\` ADD CONSTRAINT \`FK_1ad3257a7350c39854071fba211\` FOREIGN KEY (\`recipeId\`) REFERENCES \`recipe\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`recipe_ingredient\` ADD CONSTRAINT \`FK_2879f9317daa26218b5915147e7\` FOREIGN KEY (\`ingredientId\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`export_ingredient\` ADD CONSTRAINT \`FK_36d5f20b8d39d219044d862a4fb\` FOREIGN KEY (\`exportId\`) REFERENCES \`export\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`export_ingredient\` ADD CONSTRAINT \`FK_f3df601ba1b57e82a2ee13b95b2\` FOREIGN KEY (\`ingredientId\`) REFERENCES \`ingredient\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`export\` ADD CONSTRAINT \`FK_ebe442b787298681712ddb68759\` FOREIGN KEY (\`staffId\`) REFERENCES \`staff\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`staff\` ADD CONSTRAINT \`FK_0c22265b9f67020e4618c1bd4c6\` FOREIGN KEY (\`accountId\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`review\` ADD CONSTRAINT \`FK_1337f93918c70837d3cea105d39\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`review\` ADD CONSTRAINT \`FK_2a11d3c0ea1b2b5b1790f762b9a\` FOREIGN KEY (\`productId\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wishlist\` ADD CONSTRAINT \`FK_f6eeb74a295e2aad03b76b0ba87\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`wishlist\` ADD CONSTRAINT \`FK_17e00e49d77ccaf7ff0e14de37b\` FOREIGN KEY (\`productId\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`user\` ADD CONSTRAINT \`FK_68d3c22dbd95449360fdbf7a3f1\` FOREIGN KEY (\`accountId\`) REFERENCES \`account\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_f8e849201da83b87f78c7497dde\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_de264d48c1e46c66e75e2055662\` FOREIGN KEY (\`staffId\`) REFERENCES \`staff\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice\` ADD CONSTRAINT \`FK_85eb285e9157ccb9e69d77ea157\` FOREIGN KEY (\`shippingCompanyId\`) REFERENCES \`shipping_company\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_product\` ADD CONSTRAINT \`FK_28451c43926a7b7e82b80b2d3ca\` FOREIGN KEY (\`invoiceId\`) REFERENCES \`invoice\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`invoice_product\` ADD CONSTRAINT \`FK_44b0b63f5f6b86b078263363b3b\` FOREIGN KEY (\`productId\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`product\` ADD CONSTRAINT \`FK_953d6c3480e7a34ae0871ac664c\` FOREIGN KEY (\`recipeId\`) REFERENCES \`recipe\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_product\` ADD CONSTRAINT \`FK_3c7e1dfabf88ee8608e627e253b\` FOREIGN KEY (\`userId\`) REFERENCES \`user\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`cart_product\` ADD CONSTRAINT \`FK_4f1b0c66f4e0b4610e14ca42e5c\` FOREIGN KEY (\`productId\`) REFERENCES \`product\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`cart_product\` DROP FOREIGN KEY \`FK_4f1b0c66f4e0b4610e14ca42e5c\``);
        await queryRunner.query(`ALTER TABLE \`cart_product\` DROP FOREIGN KEY \`FK_3c7e1dfabf88ee8608e627e253b\``);
        await queryRunner.query(`ALTER TABLE \`product\` DROP FOREIGN KEY \`FK_953d6c3480e7a34ae0871ac664c\``);
        await queryRunner.query(`ALTER TABLE \`invoice_product\` DROP FOREIGN KEY \`FK_44b0b63f5f6b86b078263363b3b\``);
        await queryRunner.query(`ALTER TABLE \`invoice_product\` DROP FOREIGN KEY \`FK_28451c43926a7b7e82b80b2d3ca\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_85eb285e9157ccb9e69d77ea157\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_de264d48c1e46c66e75e2055662\``);
        await queryRunner.query(`ALTER TABLE \`invoice\` DROP FOREIGN KEY \`FK_f8e849201da83b87f78c7497dde\``);
        await queryRunner.query(`ALTER TABLE \`user\` DROP FOREIGN KEY \`FK_68d3c22dbd95449360fdbf7a3f1\``);
        await queryRunner.query(`ALTER TABLE \`wishlist\` DROP FOREIGN KEY \`FK_17e00e49d77ccaf7ff0e14de37b\``);
        await queryRunner.query(`ALTER TABLE \`wishlist\` DROP FOREIGN KEY \`FK_f6eeb74a295e2aad03b76b0ba87\``);
        await queryRunner.query(`ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_2a11d3c0ea1b2b5b1790f762b9a\``);
        await queryRunner.query(`ALTER TABLE \`review\` DROP FOREIGN KEY \`FK_1337f93918c70837d3cea105d39\``);
        await queryRunner.query(`ALTER TABLE \`staff\` DROP FOREIGN KEY \`FK_0c22265b9f67020e4618c1bd4c6\``);
        await queryRunner.query(`ALTER TABLE \`export\` DROP FOREIGN KEY \`FK_ebe442b787298681712ddb68759\``);
        await queryRunner.query(`ALTER TABLE \`export_ingredient\` DROP FOREIGN KEY \`FK_f3df601ba1b57e82a2ee13b95b2\``);
        await queryRunner.query(`ALTER TABLE \`export_ingredient\` DROP FOREIGN KEY \`FK_36d5f20b8d39d219044d862a4fb\``);
        await queryRunner.query(`ALTER TABLE \`recipe_ingredient\` DROP FOREIGN KEY \`FK_2879f9317daa26218b5915147e7\``);
        await queryRunner.query(`ALTER TABLE \`recipe_ingredient\` DROP FOREIGN KEY \`FK_1ad3257a7350c39854071fba211\``);
        await queryRunner.query(`ALTER TABLE \`recipe\` DROP FOREIGN KEY \`FK_9cea7f656930bb93c13a6b8fadd\``);
        await queryRunner.query(`ALTER TABLE \`recipe_type\` DROP FOREIGN KEY \`FK_dfa26051c6f125205d14a46cd53\``);
        await queryRunner.query(`ALTER TABLE \`recipe_type\` DROP FOREIGN KEY \`FK_9484c929161461b271880853ce1\``);
        await queryRunner.query(`ALTER TABLE \`import_ingredient\` DROP FOREIGN KEY \`FK_cf152e99115cd6a0f047d6f36ae\``);
        await queryRunner.query(`ALTER TABLE \`import_ingredient\` DROP FOREIGN KEY \`FK_ce556cae25e9138de4af92c33b0\``);
        await queryRunner.query(`ALTER TABLE \`import\` DROP FOREIGN KEY \`FK_8a114d142f38f0a89a9018c1917\``);
        await queryRunner.query(`DROP TABLE \`shop\``);
        await queryRunner.query(`DROP TABLE \`cart_product\``);
        await queryRunner.query(`DROP TABLE \`product\``);
        await queryRunner.query(`DROP TABLE \`invoice_product\``);
        await queryRunner.query(`DROP TABLE \`invoice\``);
        await queryRunner.query(`DROP INDEX \`REL_68d3c22dbd95449360fdbf7a3f\` ON \`user\``);
        await queryRunner.query(`DROP TABLE \`user\``);
        await queryRunner.query(`DROP TABLE \`wishlist\``);
        await queryRunner.query(`DROP TABLE \`review\``);
        await queryRunner.query(`DROP INDEX \`REL_0c22265b9f67020e4618c1bd4c\` ON \`staff\``);
        await queryRunner.query(`DROP TABLE \`staff\``);
        await queryRunner.query(`DROP TABLE \`export\``);
        await queryRunner.query(`DROP TABLE \`export_ingredient\``);
        await queryRunner.query(`DROP TABLE \`ingredient\``);
        await queryRunner.query(`DROP TABLE \`recipe_ingredient\``);
        await queryRunner.query(`DROP TABLE \`recipe\``);
        await queryRunner.query(`DROP TABLE \`recipe_type\``);
        await queryRunner.query(`DROP TABLE \`type\``);
        await queryRunner.query(`DROP TABLE \`import_ingredient\``);
        await queryRunner.query(`DROP TABLE \`import\``);
        await queryRunner.query(`DROP TABLE \`shipping_company\``);
        await queryRunner.query(`DROP TABLE \`account\``);
    }

}
