# appealServer

![Node.js](https://img.shields.io/badge/Node.js-18+-green)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-blue)
![Docker](https://img.shields.io/badge/Docker-✔-brightgreen)
![Swagger](https://img.shields.io/badge/Swagger-UI-success)  
![Migrations](https://img.shields.io/badge/DB-Migrations-informational)  

Микросервис для управления обращениями с REST API и Swagger-документацией.

## Запуск

### Docker-запуск (рекомендуется)
```bash
git clone https://github.com/c0derec0de/appealServer.git
cd appealServer
docker-compose up --build
```
### Документация доступна через Swagger UI: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)  
Основные эндпоинты:  
- `POST /appeals` - Создать обращение  
- `GET /appeals` - Получить список обращений  
- `PUT /appeals/{id}/take` - Взять в работу  
- `PUT /appeals/{id}/complete` - Завершить обращение  


### Структура базы данных
![Структура базы данных](https://github.com/c0derec0de/appealServer/blob/main/DB.png)
