dev:
	parallel -u make ::: dev-frontend dev-backend

dev-backend:
	go run .

dev-frontend:
	pnpm --prefix frontend run dev
	mv frontend/dist/pages/* frontend/dist/

