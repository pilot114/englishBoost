# english-boost: изучение английского и сербского
# Цели одинаковые во всех проектах ~/projects — см. make help.
.DEFAULT_GOAL := help

.PHONY: help
help: ## эта справка
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-12s %s\n", $$1, $$2}'

.PHONY: install
install: ## поставить зависимости
	npm ci

.PHONY: dev
dev: ## запустить для разработки
	npm run dev

.PHONY: test
test: ## тесты
	npm test

.PHONY: lint
lint: ## статический анализ
	@echo "линтера нет"

.PHONY: build
build: ## сборка
	npm run build

.PHONY: audit
audit: ## уязвимости в зависимостях
	npm audit

.PHONY: outdated
outdated: ## устаревшие зависимости
	npm outdated || true
