ARG GO_VERSION='1.18'
ARG SERVER_PORT=3535

FROM golang:${GO_VERSION}-alpine AS build

RUN apk add --no-cache git
WORKDIR /src
COPY ./go.mod ./go.sum ./
RUN go mod download
COPY ./ ./

# The build strategy below this line only works if we don't need CGO.
RUN CGO_ENABLED=0 go build \
    -installsuffix 'static' \
    -o /bin/server \
    ./cmd/server

FROM gcr.io/distroless/static AS final

USER nonroot:nonroot

COPY --from=build --chown=nonroot:nonroot /bin/server /app
EXPOSE ${SERVER_PORT}
ENTRYPOINT ["/app"]
