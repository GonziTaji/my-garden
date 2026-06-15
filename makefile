dev:
	parallel -u make ::: dev-frontend dev-backend

dev-backend:
	MY_GARDEN_WATCH=1 go run .

dev-frontend:
	pnpm -C frontend run dev

build:
	pnpm -C frontend run build
	MY_GARDEN_ENV=prod go build -o my-garden .

prod:
	MY_GARDEN_ENV=prod go run .

