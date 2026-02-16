.PHONY: install dev test lint migrate seed docker-up docker-down

install:
	pip install -r requirements.txt
	cd frontend && npm install

dev:
	python manage.py runserver & cd frontend && npm run dev

test:
	python manage.py test
	cd frontend && npm test

lint:
	flake8 .
	cd frontend && npm run lint

migrate:
	python manage.py makemigrations
	python manage.py migrate

seed:
	python manage.py loaddata fixtures/demo_portfolio.json

docker-up:
	docker-compose up -d --build

docker-down:
	docker-compose down -v
