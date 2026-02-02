# Contributing to FinTrack

## Development Setup

1. Clone the repository
2. Copy `.env.example` to `.env` and configure database credentials
3. Install backend dependencies: `pip install -r requirements.txt`
4. Run migrations: `python manage.py migrate`
5. Seed demo data: `python manage.py loaddata fixtures/demo_portfolio.json`
6. Start the backend: `python manage.py runserver`
7. Install frontend dependencies: `cd frontend && npm install`
8. Start the frontend: `npm run dev`

## Running Tests

```bash
# Backend tests
python manage.py test

# Frontend tests
cd frontend && npm test

# With coverage
coverage run manage.py test && coverage report
```

## Code Style

- Python: follow PEP 8, use type hints for function signatures
- TypeScript: ESLint + Prettier (configured in frontend/)
- Commit messages: conventional commits (`feat:`, `fix:`, `docs:`, `test:`, `chore:`)

## Pull Request Process

1. Create a feature branch from `main`
2. Write tests for new functionality
3. Ensure all tests pass locally
4. Update documentation if adding new API endpoints
5. Submit a PR with a clear description of changes
