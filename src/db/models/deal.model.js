"use strict";

const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  sequelize.define(
    "deal",
    {
      id: {
        type: DataTypes.INTEGER(11),
        autoIncrement: true,
        primaryKey: true,
      },
      client_id: {
        type: DataTypes.INTEGER(11),
        allowNull: false,
        defaultValue: 0,
      },
      handling_by: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      status: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_successful: {
        type: DataTypes.TINYINT(1),
        allowNull: true,
        defaultValue: null,
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
      tableName: "deal",
      createdAt: "created_at",
      updatedAt: "updated_at",
      indexes: [
        { name: "client_id", fields: ["client_id"] },
        { name: "status", fields: ["status"] },
        { name: "handling_by", fields: ["handling_by"] },
      ],
    }
  );
};
