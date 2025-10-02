const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const { postgresDB } = require('../config/database');

let AdminUser, AdminSession;

const initializeAdminModels = () => {
  const sequelize = postgresDB();

  if (!sequelize) {
    throw new Error('Database connection not available');
  }

  // Admin Users Model
  AdminUser = sequelize.define('AdminUser', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    email: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true,
      validate: {
        isEmail: true
      }
    },
    password: {
      type: DataTypes.STRING(255),
      allowNull: false
    },
    first_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    last_name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    role: {
      type: DataTypes.ENUM('super_admin', 'admin', 'editor'),
      defaultValue: 'admin'
    },
    avatar: {
      type: DataTypes.STRING(500),
      allowNull: true
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    last_login_at: {
      type: DataTypes.DATE,
      allowNull: true
    },
    login_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0
    },
    password_changed_at: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'admin_users',
    underscored: true,
    timestamps: true,
    hooks: {
      beforeCreate: async (user) => {
        if (user.password) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
        }
      },
      beforeUpdate: async (user) => {
        if (user.changed('password')) {
          const salt = await bcrypt.genSalt(12);
          user.password = await bcrypt.hash(user.password, salt);
          user.password_changed_at = new Date();
        }
      }
    }
  });

  // Admin Sessions Model (for session tracking)
  AdminSession = sequelize.define('AdminSession', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },
    admin_user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: 'admin_users',
        key: 'id'
      }
    },
    token_hash: {
      type: DataTypes.STRING(255),
      allowNull: false,
      unique: true
    },
    ip_address: {
      type: DataTypes.STRING(45)
    },
    user_agent: {
      type: DataTypes.TEXT
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false
    }
  }, {
    tableName: 'admin_sessions',
    underscored: true,
    timestamps: true
  });

  // Instance methods for AdminUser
  AdminUser.prototype.validatePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
  };

  AdminUser.prototype.getFullName = function() {
    return `${this.first_name} ${this.last_name}`;
  };

  AdminUser.prototype.toSafeObject = function() {
    return {
      id: this.id,
      email: this.email,
      first_name: this.first_name,
      last_name: this.last_name,
      full_name: this.getFullName(),
      role: this.role,
      avatar: this.avatar,
      is_active: this.is_active,
      last_login_at: this.last_login_at,
      login_count: this.login_count,
      created_at: this.created_at
    };
  };

  // Define Associations
  AdminUser.hasMany(AdminSession, { foreignKey: 'admin_user_id', as: 'sessions' });
  AdminSession.belongsTo(AdminUser, { foreignKey: 'admin_user_id', as: 'admin_user' });

  return {
    AdminUser,
    AdminSession
  };
};

module.exports = {
  initializeAdminModels,
  getAdminModels: () => ({
    AdminUser,
    AdminSession
  })
};