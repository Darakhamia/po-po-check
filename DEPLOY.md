# POlyglot Deployment Guide

Инструкция по деплою POlyglot на сервер с доменом polyglot.sbs

## Требования

- Linux сервер с Docker и Docker Compose
- Домен polyglot.sbs направленный на IP сервера
- OpenAI API ключ

## Шаг 1: Настройка DNS

В панели управления доменом (Cloudflare/Namecheap/etc) добавь записи:

```
A    @      →  IP_ТВОЕГО_СЕРВЕРА
A    www    →  IP_ТВОЕГО_СЕРВЕРА
```

Подожди 5-10 минут пока DNS обновится.

## Шаг 2: Подготовка сервера

```bash
# Остановить контейнер который занимает порт 80
docker stop mealplanner-frontend

# Клонировать репозиторий (или скопировать файлы)
cd /opt
git clone <repo-url> polyglot
cd polyglot
```

## Шаг 3: Настройка окружения

```bash
# Создать .env файл
cp .env.example .env

# Отредактировать .env
nano .env
```

Заполни:
```env
DB_PASSWORD=твой_надежный_пароль_для_бд
OPENAI_API_KEY=sk-твой-openai-ключ
```

## Шаг 4: Запуск Traefik

```bash
# Создать сеть для Traefik (один раз)
docker network create traefik-public

# Запустить Traefik
docker compose -f docker-compose.traefik.yml up -d

# Проверить что работает
docker logs traefik
```

## Шаг 5: Запуск POlyglot

```bash
# Собрать и запустить
docker compose -f docker-compose.prod.yml up -d --build

# Проверить логи
docker logs polyglot-backend
docker logs polyglot-frontend
```

## Шаг 6: Проверка

Открой в браузере:
- https://polyglot.sbs - должен открыться POlyglot
- SSL сертификат должен быть валидным (зеленый замочек)

## Полезные команды

```bash
# Посмотреть логи
docker compose -f docker-compose.prod.yml logs -f

# Перезапустить
docker compose -f docker-compose.prod.yml restart

# Остановить
docker compose -f docker-compose.prod.yml down

# Обновить (после git pull)
docker compose -f docker-compose.prod.yml up -d --build

# Посмотреть статус контейнеров
docker ps
```

## Troubleshooting

### SSL сертификат не выдается
- Проверь что DNS записи правильные: `dig polyglot.sbs`
- Проверь логи Traefik: `docker logs traefik`
- Let's Encrypt имеет лимиты - подожди час если превысил

### 502 Bad Gateway
- Проверь что backend запущен: `docker ps`
- Проверь логи backend: `docker logs polyglot-backend`

### База данных не подключается
- Проверь что db контейнер healthy: `docker ps`
- Проверь DATABASE_URL в логах backend

## Бэкап базы данных

```bash
# Создать бэкап
docker exec polyglot-db pg_dump -U polyglot polyglot > backup_$(date +%Y%m%d).sql

# Восстановить из бэкапа
docker exec -i polyglot-db psql -U polyglot polyglot < backup_20240101.sql
```

## Обновление

```bash
cd /opt/polyglot
git pull
docker compose -f docker-compose.prod.yml up -d --build
```
