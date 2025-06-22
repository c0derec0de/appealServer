exports.up = (pgm) => {
    pgm.createTable('appeals', {
      id: {
        type: 'serial',
        primaryKey: true,
      },
      topic: {
        type: 'text',
        notNull: true,
      },
      message: {
        type: 'text',
        notNull: true,
      },
      status: {
        type: 'text',
        notNull: true,
      },
      init_date: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
      update_date: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
    });
  
    pgm.createTable('appeal_responses', {
      id: {
        type: 'serial',
        primaryKey: true,
      },
      appeal_id: {
        type: 'integer',
        notNull: true,
        references: 'appeals(id)',
        onDelete: 'cascade',
      },
      response_message: {
        type: 'text',
        notNull: true,
      },
      date: {
        type: 'timestamp',
        notNull: true,
        default: pgm.func('current_timestamp'),
      },
    });
  };
  
  exports.down = (pgm) => {
    pgm.dropTable('appeal_responses');
    pgm.dropTable('appeals');
  };