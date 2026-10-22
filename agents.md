# english-boost

Изучение английского и сербского: свой словарь из загруженных текстов, режим чтения с подсветкой,
интервальные повторения. Перевод — локальная модель в LM Studio. Подробно — `readme.md`.

## Стек

Vue 3 + Pinia, Vite 8, Vitest 5. Node — версия из `.nvmrc` (24): на 22.11 из nvm по умолчанию
`npm ci` падает с `Cannot read properties of null (reading 'edgesOut')`.

## Как устроено

- Перевод идёт на относительный `/llm`, dev-сервер Vite проксирует его на LM Studio
  (`http://127.0.0.1:1234`, модель `translategemma-12b-it`). Системный промпт этой модели слать нельзя.
- Сборка `dist/` раздаётся caddy из wshell на lang.wshell.com.

## Команды

Цели Makefile одинаковые во всех проектах `~/projects` (`make help` — список):

- `make install` — поставить зависимости
- `make dev` — запустить для разработки
- `make test` — тесты
- `make lint` — статический анализ
- `make build` — сборка
- `make audit` — уязвимости в зависимостях
- `make outdated` — устаревшие зависимости
