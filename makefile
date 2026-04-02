dev:
	parallel -u make ::: dev-frontend dev-backend

dev-backend:
	MY_GARDEN_WATCH=1 go run .

dev-frontend:
	pnpm -C frontend run dev
	mv frontend/dist/pages/* frontend/dist/

