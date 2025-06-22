# appealServer
Запуск: docker-compose up --build
Сервер: http://localhost:3000
Swagger UI: http://localhost:3000/api-docs
PostgreSQL: postgres:5432

POST /appeals – Создать обращение
GET /appeals – Список обращений (фильтры: status, date, startDate/endDate)
PUT /appeals/{id}/take – Взять в работу
PUT /appeals/{id}/complete – Завершить (solution в response_message)
PUT /appeals/{id}/cancel – Отменить (cancellation_reason в response_message)
