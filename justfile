start:
	docker compose up --build -d
	@echo "Waiting for database to be ready..."
	@sleep 3
	docker compose exec app bun run db:migrate:sql

clean:
	docker compose down -v

install:
	bun --bun install

migrate:
	docker compose exec app bun run db:migrate:sql

migrate-local:
	bun run db:migrate:sql