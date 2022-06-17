cd web/quickplan && npm install
npm run dev &
cd ../.. && go build -o bin/server cmd/server/main.go
./bin/server &

