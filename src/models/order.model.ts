import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../utils/database';

export class Order extends Model { }

Order.init(
  {
    merchantId: DataTypes.INTEGER,
    requestId: DataTypes.STRING,
    clientId: DataTypes.INTEGER,
    pax_size: DataTypes.INTEGER,
    seat: DataTypes.STRING,
    status: DataTypes.STRING
  },
  {
    sequelize,
    modelName: 'Order',
    tableName: 'orders',
    timestamps: true
  }
);
