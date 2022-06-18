# quickplan

Faster PERT charts.

[![Go: 1.18](https://img.shields.io/badge/Go-v1.18-blue.svg)](https://golang.org/dl/)

#### Contents

1. [Quickstart](#quickstart)
    * [Prerequisites](#prerequisites)
    * [Running the App](#running-the-app)
    * [Using Docker](#using-docker)
2. [What and Why?](#what-and-why)
3. [Deployment](#deployment)
4. [Limitations](#limitations)
5. [Contributing](#contributing)

---

## Quickstart

This gets you up and running as quickly as possible.

### Prerequisites

You need these things installed on your machine to run the application:

1. NPM
2. Go (or Docker)

### Running the App

Now you're ready to run locally. We run the UI and the server separately.

From project root:

```shell
./scripts/run-local.sh
```

The UI and server are running in the background. Visit the UI at `http://localhost:3000` - no login required!

### Using Docker

If you don't have Go, you can use Docker. The `build/Dockerfile` works great, and it's a pretty small image (~23MB)!

```shell
docker build -f build/Dockerfile . -t quickplan
docker run quickplan -p 3535:3535
```

You'll still need to run the UI:

```shell
cd web/quickplan && npm install && npm run dev
```

## What and Why?

[![screenshot](./docs/img/screenshot-sm.png)](./docs/img/screenshot.png)

This application helps you graphically, iteratively plan a project and visualize it on a PERT chart.
I find PERT charts easier to understand than Gantt charts, and dependencies are clearly visible.

But **why** make this at all?

I needed to plan a big project at work. I couldn't find any tools that would chart dependencies without requiring a pre-made spreadsheet. So I made this.

## Deployment

The `deployment/` directory has empty Kubernetes files - so that's a TODO.

Something like `fly.io` would host the backend fine, and the UI could go on GitHub Pages. 

## Limitations

Tons of limitations!

The most obvious limitation is that there isn't a persistent storage backend. Everything is in memory.
To get around that, **export the JSON** before you quit the application.

If you forget, as a last-ditch recovery, you can check `/tmp/` for files like `quickplan.<id>.tmp.graph`.
These are the JSON exports for the most recent version of your PERT chart.

## Contributing

The project needs work - please feel free to submit your PR!
