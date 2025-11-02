# Documentation

This directory contains the MkDocs documentation for QuickPlan.

## Directory Structure

```
docs/
├── mkdocs.yml          # MkDocs configuration
├── requirements.txt    # Python dependencies
├── venv/              # Python virtual environment (gitignored)
├── content/           # Documentation content
│   ├── index.md
│   ├── img/           # Images and assets
│   ├── getting-started/
│   ├── user-guide/
│   ├── development/
│   └── about/
└── site/              # Built documentation (gitignored)
```

## Setup

Create and activate a Python virtual environment, then install dependencies:

```bash
cd docs
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Development

To serve the documentation locally with live reload:

```bash
cd docs
source venv/bin/activate  # On Windows: venv\Scripts\activate
mkdocs serve
```

Then visit http://127.0.0.1:8000

## Building

To build the static site:

```bash
cd docs
source venv/bin/activate  # On Windows: venv\Scripts\activate
mkdocs build
```

The built site will be in the `site/` directory.

## Deployment

To deploy to GitHub Pages:

```bash
cd docs
source venv/bin/activate  # On Windows: venv\Scripts\activate
mkdocs gh-deploy
```
