# Cloud Resume Challenge — Frontend

[日本語](./README.md) | English

A Japanese cloud resume delivered on AWS. The static HTML/CSS/JavaScript site integrates a visitor counter and a resume-focused RAG assistant.

**Demo:** https://dyp8879eswsdu.cloudfront.net/

## System architecture

[![AI-Powered Cloud Portfolio architecture](docs/architecture/AI-Powered-Cloud-Portfolio.png)](docs/architecture/AI-Powered-Cloud-Portfolio.html)

Click the image to open the interactive diagram. This repository owns static delivery, the Portfolio UI, and both browser API clients.

## Frontend responsibilities

- Deliver static resume assets through Amazon S3 and CloudFront
- Fetch and display visitor statistics through `GET /count`
- Send single-turn questions to the RAG API through `POST /ask`
- Render Japanese answers, sources, loading states, and error states
- Provide a framework-free RAG widget built with Shadow DOM
- Support mobile layouts and keyboard interaction

## Key files

```text
index.html       Main resume page
style.css        Site-specific styles
script.js        Visitor-counter API client
rag-widget.js    RAG chat Web Component
assets/          Template CSS, JavaScript, and web fonts
images/          Portfolio images
```

## Runtime flow

```text
Browser → CloudFront → Amazon S3 → Portfolio UI
                                  ├─ GET /count → Counter API
                                  └─ POST /ask  → RAG API
```

AWS credentials, Knowledge Base IDs, model ARNs, and system prompts are never placed in browser code.

## Local development

```powershell
python -m http.server 8000
```

Open `http://127.0.0.1:8000`. The RAG API endpoint is injected through page configuration.

## Technology

- HTML5, CSS, and Vanilla JavaScript
- Web Components / Shadow DOM
- Amazon S3 and Amazon CloudFront
- Amazon API Gateway
- GitHub Actions

## Related repositories

- [rag-practice](https://github.com/LUOLIFAN-CHUO/rag-practice) — RAG API, knowledge content, and Bedrock infrastructure
- [cloud-resume-backend](https://github.com/LUOLIFAN-CHUO/cloud-resume-backend) — visitor-counter API

## Architecture artifacts

- [Interactive HTML](docs/architecture/AI-Powered-Cloud-Portfolio.html)
- [Archify source specification](docs/architecture/AI-Powered-Cloud-Portfolio.architecture.json)
- [PNG preview](docs/architecture/AI-Powered-Cloud-Portfolio.png)
