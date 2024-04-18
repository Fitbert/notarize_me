const { Sequelize, DataTypes } = require('sequelize');

let sequelize;

if (process.env.JAWSDB_URL) {
  // If JawsDB URL is available (Heroku environment)
  sequelize = new Sequelize(process.env.JAWSDB_URL);
} else {
  // Otherwise, use local development configuration
  sequelize = new Sequelize('database', 'username', 'password', {
    host: 'localhost',
    dialect: 'mysql', // Change the dialect to 'mysql'
    // Remove dialectModule
  });
}

const User = sequelize.define('User', {
  // Define attributes
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false,
  }
}, {
  // Model options
  tableName: 'users',
  timestamps: false,
});

module.exports = User;
