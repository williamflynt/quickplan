ARG GO_VERSION='1.18'
ARG SERVER_PORT=3535

FROM golang:${GO_VERSION} AS build

RUN curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
RUN apt install -y git nodejs
WORKDIR /src
COPY ./go.mod ./go.sum ./
RUN go mod download
COPY ./ ./

WORKDIR /src/web/quickplan
RUN npm --silent install && npm run --silent build

WORKDIR /src
RUN CGO_ENABLED=1 GOOS=linux go build \
    -a -ldflags '-linkmode external -extldflags "-static"' \
    -o /bin/server \
    ./cmd/server

FROM gcr.io/distroless/static AS final

USER nonroot:nonroot

COPY --from=build --chown=nonroot:nonroot /bin/server /app
EXPOSE ${SERVER_PORT}
ENTRYPOINT ["/app"]
