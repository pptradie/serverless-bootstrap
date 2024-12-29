function applyExtraSetup(sequelize) {
  const { deal, deal_note } = sequelize.models;

  deal.hasMany(deal_note, {
    as: "deal_notes",
    sourceKey: "id",
    foreignKey: "deal_id",
  });

  deal_note.belongsTo(deal, {
    as: "deal",
    targetKey: "id",
    foreignKey: "deal_id",
  });
}

module.exports = { applyExtraSetup };
