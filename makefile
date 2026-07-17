SMTP_PASS := $(shell cat ~/.secrets/mygarden-google-secret | tr -d ' \n')
SESSION_SECRET := $(shell cat ~/.secrets/mygarden-session-secret | tr -d ' \n')

export MY_GARDEN_SMTP_HOST := smtp.gmail.com
export MY_GARDEN_SMTP_PORT := 587
export MY_GARDEN_SMTP_USER := gonzalo.tajmuch@gmail.com
export MY_GARDEN_SMTP_PASS := $(SMTP_PASS)
export MY_GARDEN_SMTP_FROM := gonzalo.tajmuch@gmail.com

export MY_GARDEN_SESSION_SECRET := $(SESSION_SECRET)

dev:
	MY_GARDEN_ORIGIN=http://192.168.1.8:8080 \
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
