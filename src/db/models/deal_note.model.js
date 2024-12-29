"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "deal_note",
    {
      id: {
        type: DataTypes.INTEGER(10),
        autoIncrement: true,
        primaryKey: true,
      },
      deal_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
      },
      note: {
        type: DataTypes.TEXT("long"),
        allowNull: false,
      },
      created_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      updated_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      as: "deal_note",
      freezeTableName: true,
      tableName: "deal_note",
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [{ name: "deal_id", fields: ["deal_id"] }],
    }
  );
};
