export MY_GARDEN_SMTP_HOST := smtp.gmail.com
export MY_GARDEN_SMTP_PORT := 587
export MY_GARDEN_SMTP_USER := gonzalo.tajmuch@gmail.com
export MY_GARDEN_SMTP_PASS := tyuxbasoaisxxsmy
export MY_GARDEN_SMTP_FROM := gonzalo.tajmuch@gmail.com

export MY_GARDEN_SESSION_SECRET := ajkdsfkalsdhlkf

dev:
	MY_GARDEN_ORIGIN=http://192.168.1.8:5173 \
	parallel -u make ::: dev-frontend dev-backend-watch

dev-backend-watch:
	MY_GARDEN_ORIGIN=http://localhost:8080 go run . --watch

dev-backend:
	MY_GARDEN_ORIGIN=http://localhost:8080 go run .

dev-frontend:
	pnpm -C frontend run dev

build:
	pnpm -C frontend run build
	MY_GARDEN_ENV=prod go build -o my-garden .

prod:
	MY_GARDEN_ENV=prod MY_GARDEN_ORIGIN=179.2.50.11/my-garden go run .
