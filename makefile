dev:
	parallel -u make ::: dev-frontend dev-backend

dev-backend:
	go run .

dev-frontend:
	pnpm -C frontend run dev

build:
	pnpm -C frontend run build
	MY_GARDEN_ENV=prod go build -o my-garden .

prod:
	MY_GARDEN_ENV=prod go run .

