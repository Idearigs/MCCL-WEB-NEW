// Initialize MongoDB database for McCulloch Website

// Switch to the application database
db = db.getSiblingDB('mcculloch_logs');

// Create collections with validation
db.createCollection('system_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['level', 'message', 'timestamp'],
      properties: {
        level: {
          bsonType: 'string',
          enum: ['error', 'warn', 'info', 'debug']
        },
        message: {
          bsonType: 'string'
        },
        timestamp: {
          bsonType: 'date'
        },
        userId: {
          bsonType: 'string'
        },
        metadata: {
          bsonType: 'object'
        }
      }
    }
  }
});

db.createCollection('audit_logs', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['action', 'userId', 'timestamp'],
      properties: {
        action: {
          bsonType: 'string'
        },
        userId: {
          bsonType: 'string'
        },
        timestamp: {
          bsonType: 'date'
        },
        details: {
          bsonType: 'object'
        }
      }
    }
  }
});

db.createCollection('analytics', {
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['event', 'timestamp'],
      properties: {
        event: {
          bsonType: 'string'
        },
        timestamp: {
          bsonType: 'date'
        },
        userId: {
          bsonType: 'string'
        },
        sessionId: {
          bsonType: 'string'
        },
        data: {
          bsonType: 'object'
        }
      }
    }
  }
});

// Create indexes for performance
db.system_logs.createIndex({ 'timestamp': -1 });
db.system_logs.createIndex({ 'level': 1, 'timestamp': -1 });
db.system_logs.createIndex({ 'userId': 1, 'timestamp': -1 });

db.audit_logs.createIndex({ 'timestamp': -1 });
db.audit_logs.createIndex({ 'userId': 1, 'timestamp': -1 });
db.audit_logs.createIndex({ 'action': 1, 'timestamp': -1 });

db.analytics.createIndex({ 'timestamp': -1 });
db.analytics.createIndex({ 'event': 1, 'timestamp': -1 });
db.analytics.createIndex({ 'userId': 1, 'timestamp': -1 });

print('MongoDB initialization completed for McCulloch Website');