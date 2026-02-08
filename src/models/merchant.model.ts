import { DataTypes, Model, Optional } from 'sequelize';
import { sequelize } from '../utils/database';

interface MerchantAttributes {
  id: number;
}

type MerchantCreationAttributes =
  Optional<MerchantAttributes, 'id'>;

export class Merchant
  extends Model<MerchantAttributes, MerchantCreationAttributes>
  implements MerchantAttributes {
  public id!: number;

  public readonly createdAt!: Date;
  public readonly updatedAt!: Date;
}

Merchant.init(
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      autoIncrement: true,
      primaryKey: true
    }
  },
  {
    sequelize,
    modelName: 'Merchant',
    tableName: 'merchant',

    timestamps: true
  }
);
