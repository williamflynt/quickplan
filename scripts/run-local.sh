cd web/quickplan && npm install && npm run build
cd ../.. && go build -o bin/server cmd/server/main.go
./bin/server &
