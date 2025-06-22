import express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { pool, initializeDatabase } from './database.js';

const app = express();
app.use(express.json());

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'API системы обращений',
      version: '1.0.0',
      description: 'Документация API для системы работы с обращениями',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Локальный сервер',
      },
    ],
    tags: [
        {
          name: 'Appeals',
          description: 'Операции с обращениями',
        },
      ],
    components: {
      schemas: {
        Appeal: {
          type: 'object',
          properties: {
            id: { type: 'integer', example: 1 },
            topic: { type: 'string', example: 'Проблема с водой' },
            message: { type: 'string', example: 'Нет холодной воды' },
            status: { 
              type: 'string', 
              enum: ['Новое', 'В работе', 'Завершено', 'Отменено'],
              example: 'Новое'
            },
            response_message: { type: 'string', example: 'Проблема решена' },
            init_date: { type: 'string', format: 'date-time' },
            update_date: { type: 'string', format: 'date-time' }
          }
        }
      }
    }
  },
  apis: ['./app.js'], 
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

initializeDatabase()
  .then(() => console.log('БД создана успешно'))
  .catch(err => {
    console.error('Ошибка при создании БД', err);
    process.exit(1);
  });

/**
 * @swagger
 * /appeals:
 *   post:
 *     summary: Создать новое обращение
 *     tags: [Appeals]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               topic:
 *                 type: string
 *               message:
 *                 type: string
 *             required:
 *               - topic
 *               - message
 *     responses:
 *       201:
 *         description: Созданное обращение
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appeal'
 *       500:
 *         description: Ошибка сервера
 */
app.post('/appeals', async (req, res) => {
    try {
        const {topic, message} = req.body;
        const result = await pool.query(
            'INSERT INTO appeals (topic, message, status) VALUES ($1, $2, $3) RETURNING *',
            [topic, message, 'Новое']);
        res.status(201).json(result.rows[0]);
    } catch(err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /appeals:
 *   get:
 *     summary: Получить список обращений
 *     tags: [Appeals]
 *     parameters:
 *       - in: query
 *         name: date
 *         schema:
 *           type: string
 *           format: date
 *         description: Фильтр по конкретной дате
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Начальная дата диапазона
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Конечная дата диапазона
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: ['Новое', 'В работе', 'Завершено', 'Отменено']
 *         description: Фильтр по статусу
 *     responses:
 *       200:
 *         description: Список обращений
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Appeal'
 *       500:
 *         description: Ошибка сервера
 */
app.get('/appeals', async (req, res) => {
    try {
        const { date, startDate, endDate, status} = req.query;
        let query = 'SELECT * FROM appeals WHERE 1=1';
        const params = [];

        if (date) {
            query += ' AND DATE(init_date) = $1';
            params.push(date);
        }
        if (startDate && endDate){
            query += ` AND init_date BETWEEN $${params.length + 1} AND $${params.length + 2}`;
            params.push(startDate, endDate);
        }
        if (status) {
            query += ` AND status = $${params.length + 1}`;
            params.push(status);
        }
        query += ' ORDER BY init_date DESC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /appeals/{id}/take:
 *   put:
 *     summary: Взять обращение в работу
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID обращения
 *     responses:
 *       200:
 *         description: Обновленное обращение
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appeal'
 *       404:
 *         description: Обращение не найдено или уже в работе
 *       500:
 *         description: Ошибка сервера
 */
app.put('/appeals/:id/take', async (req, res) => {
    try{
        const {id} = req.params;
        const result = await pool.query(
            'UPDATE appeals SET status = $1, update_date = CURRENT_TIMESTAMP WHERE id = $2 AND status = $3 RETURNING *',
            ['В работе', id, 'Новое']
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Обращение не найдено или уже в работе'});
        }
        res.json(result.rows[0]); 
    } catch (err) {
        res.status(500).json({error: err.message});
    }
});

/**
 * @swagger
 * /appeals/{id}/complete:
 *   put:
 *     summary: Завершить обработку обращения
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID обращения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response_message:
 *                 type: string
 *             required:
 *               - response_message
 *     responses:
 *       200:
 *         description: Обновленное обращение
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appeal'
 *       404:
 *         description: Обращение не найдено или не в работе
 *       500:
 *         description: Ошибка сервера
 */
app.put('/appeals/:id/complete', async (req, res) => {
    const client = await pool.connect();
    try {
        const {id} = req.params;
        const { solution } = req.body;
    
        await client.query('BEGIN');
        const appealResult = await client.query(
            `UPDATE appeals 
             SET status = 'Завершено', 
                 update_date = CURRENT_TIMESTAMP 
             WHERE id = $1 AND status = 'В работе' 
             RETURNING *`,
            [id]
        );
        
        if (appealResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Обращение не найдено или не в работе' });
        }
        
        await client.query(
            `INSERT INTO appeal_responses (appeal_id, response_message)
             VALUES ($1, $2)`,
            [id, `Обращение завершено. Решение: ${solution}`]
        );
        
        await client.query('COMMIT');
        res.json(appealResult.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({error: err.message});
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /appeals/{id}/cancel:
 *   put:
 *     summary: Отменить обращение
 *     tags: [Appeals]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID обращения
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response_message:
 *                 type: string
 *             required:
 *               - response_message
 *     responses:
 *       200:
 *         description: Обновленное обращение
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Appeal'
 *       404:
 *         description: Обращение не найдено или уже завершено
 *       500:
 *         description: Ошибка сервера
 */
app.put('/appeals/:id/cancel', async (req, res) => {
    const client = await pool.connect();
    try {
        const {id} = req.params;
        const {cancellation_reason} = req.body;

        await client.query('BEGIN');

        const appealResult = await client.query(
            `UPDATE appeals SET status = 'Отменено',
             update_date = CURRENT_TIMESTAMP 
             WHERE id = $1 AND status IN ('Новое', 'В работе')
             RETURNING *`,
             [id]
        );
        
        if (appealResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({error: 'Обращение не найдено или уже завершено'});
        }
        
        await client.query(
            `INSERT INTO appeal_responses (appeal_id, response_message)
             VALUES ($1, $2)`,
            [id, `Отмена обращения. Причина: ${cancellation_reason}`]
        );
        
        await client.query('COMMIT');
        res.json(appealResult.rows[0]);
    } catch (err){
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

/**
 * @swagger
 * /appeals/cancel-all-in-work:
 *   put:
 *     summary: Отменить все обращения в статусе "В работе"
 *     tags: [Appeals]
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               response_message:
 *                 type: string
 *                 default: "Отмена всех обращений"
 *     responses:
 *       200:
 *         description: Результат массовой отмены
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 appeals:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Appeal'
 *       500:
 *         description: Ошибка сервера
 */
app.put('/appeals/cancel-all-in-work', async (req, res) => {
    const client = await pool.connect();
    try {
        const {response_message = 'Отмена всех обращений'} = req.body;
        await client.query('BEGIN');
        
        const appealsId = await client.query(
            `SELECT id FROM appeals WHERE status = 'В работе'`
        );

        const updatedResult = await client.query(
            `UPDATE appeals 
             SET status = 'Отменено',
                 update_date = CURRENT_TIMESTAMP
             WHERE status = 'В работе'
             RETURNING *`
        );
        
        for (const appeal of appealsId.rows){
            await client.query(
                `INSERT INTO appeal_responses (appeal_id, response_message)
                 VALUES ($1, $2)`,
                [appeal.id, `Отмена обращения. Причина: ${response_message}`]
            );
        }
        
        await client.query('COMMIT');
        res.json({ 
            message: `Отменено ${updatedResult.rowCount} обращений`,
            appeals: updatedResult.rows
        });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({error: err.message});
    } finally {
        client.release();
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
    console.log(`Swagger UI доступен по адресу http://localhost:${PORT}/api-docs`);
});