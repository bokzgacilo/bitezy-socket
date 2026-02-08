import { DataTypes, Model } from 'sequelize';
import { sequelize } from '../utils/database';

export class OrderItem extends Model { }

OrderItem.init(
  {
    orderId: DataTypes.INTEGER,
    menuId: DataTypes.INTEGER,
    qty: DataTypes.INTEGER,
    notes: DataTypes.STRING,
  },
  {
    sequelize,
    modelName: 'OrderItem',
    tableName: 'order_items'
  }
);
