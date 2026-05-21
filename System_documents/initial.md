# Company Standard: Node.js + Express + TypeScript Template

## 1\. Purpose

This document defines the **official backend service template** for the company. It standardizes how Node.js services are created, structured, validated, logged, and maintained. All new backend services **must** be created using this template unless an explicit exception is approved.

This template is designed to be: - Production-ready - Easy to clone and onboard - Strict enough for enterprise usage - Flexible enough for future extensions

## 2\. Technology Stack

| Area               | Standard                  |
| ------------------ | ------------------------- |
| Runtime            | Node.js (LTS)             |
| Framework          | Express                   |
| Language           | TypeScript                |
| Build Tool         | TypeScript Compiler (tsc) |
| Logging            | Winston                   |
| Validation         | Joi                       |
| Linting            | ESLint                    |
| Formatting         | Prettier                  |
| Git Hooks          | Husky + lint-staged       |
| Testing            | Jest                      |
| Environment Config | dotenv                    |

## 3\. Repository Structure

node-express-ts-template/  
├── src/  
│ ├── app.ts  
│ ├── server.ts  
│ ├── config/  
│ │ ├── env.ts  
│ │ └── logger.ts  
│ ├── modules/  
│ │ └── &lt;module-name&gt;/  
│ │ ├── &lt;module&gt;.route.ts  
│ │ ├── &lt;module&gt;.controller.ts  
│ │ ├── &lt;module&gt;.service.ts  
│ │ └── &lt;module&gt;.schema.ts  
│ ├── middlewares/  
│ │ ├── validate.middleware.ts  
│ │ ├── error.middleware.ts  
│ │ └── request-logger.middleware.ts  
│ ├── utils/  
│ └── types/  
├── tests/  
├── .husky/  
├── tsconfig.json  
├── package.json  
└── README.md

## 4\. Application Bootstrap

### 4.1 app.ts

Responsible for: - Express initialization - Global middleware registration - Route registration - Error handling

app.use(express.json());  
app.use(requestLogger);  
app.use('/api', routes);  
app.use(errorHandler);

### 4.2 server.ts

Responsible for: - Reading environment configuration - Starting HTTP server

app.listen(PORT, () => {  
logger.info(\`Server running on port \${PORT}\`);  
});

## 5\. Environment Configuration

The application supports **separate environment configurations** for Development, QA, and Production. This is mandatory for all services.

### 5.1 Supported Environments

| Environment | Description                        |
| ----------- | ---------------------------------- |
| development | Local developer machines           |
| qa          | Integration / UAT / pre-production |
| production  | Live production workloads          |

### 5.2 Environment Files

.env.development  
.env.qa  
.env.production  
.env.example

**Rules:** - .env.example must be committed - Real secrets must never be committed - QA and Production values are injected via CI/CD or platform configuration

### 5.3 Example Environment Files

**.env.development**

NODE_ENV=development  
PORT=3000  
LOG_LEVEL=debug

**.env.qa**

NODE_ENV=qa  
PORT=4000  
LOG_LEVEL=info

**.env.production**

NODE_ENV=production  
PORT=80  
LOG_LEVEL=warn

### 5.4 Environment Loader (Single Source of Truth)

import dotenv from 'dotenv';  
import path from 'path';  
<br/>const NODE_ENV = process.env.NODE_ENV || 'development';  
<br/>dotenv.config({  
path: path.resolve(process.cwd(), \`.env.\${NODE_ENV}\`),  
});  
<br/>export const env = {  
nodeEnv: NODE_ENV,  
port: Number(process.env.PORT),  
logLevel: process.env.LOG_LEVEL ?? 'info',  
};

⚠️ env.ts must be imported before any module that reads environment variables.

### 5.5 Environment Validation (Mandatory)

import Joi from 'joi';  
<br/>const envSchema = Joi.object({  
PORT: Joi.number().required(),  
LOG_LEVEL: Joi.string().valid('debug', 'info', 'warn', 'error'),  
}).unknown();  
<br/>const { error } = envSchema.validate(process.env);  
<br/>if (error) {  
throw new Error(\`Environment validation error: \${error.message}\`);  
}

## 6\. Logging Standard (Winston)

### 6.1 Logger Configuration

A **single shared logger instance** must be used across the application.

export const logger = winston.createLogger({  
level: process.env.LOG_LEVEL || 'info',  
transports: \[new winston.transports.Console()\],  
});

### 6.2 Logging Rules

- ❌ console.log is forbidden
- ✅ Use logger.info, logger.warn, logger.error
- ✅ Errors must be logged once, centrally

## 7\. Request Logging Middleware

All incoming requests are logged automatically.

logger.info(\`\${req.method} \${req.originalUrl}\`);

## 8\. Validation Standard (Joi)

### 8.1 Validation Philosophy

- Every external API request **must** be validated
- Validation logic lives alongside the module
- Controllers must assume validated input

### 8.2 Schema Example

export const createUserSchema = Joi.object({  
email: Joi.string().email().required(),  
password: Joi.string().min(8).required(),  
name: Joi.string().min(2).required(),  
});

### 8.3 Validation Middleware

router.post('/', validate(createUserSchema), controller);

## 9\. Error Handling

### 9.1 Centralized Error Middleware

Responsibilities: - Handle Joi validation errors - Log unexpected errors - Return safe API responses

if (err.isJoi) {  
return res.status(400).json({ message: 'Validation failed' });  
}

## 10\. Module Design Rules

Each module must contain: - Route layer (HTTP concerns) - Controller layer (request/response mapping) - Service layer (business logic) - Schema layer (validation)

**No business logic is allowed in routes or controllers.**

## 11\. Build & Run

### Development

pnpm dev

### Build

pnpm build

### Production

pnpm start

## 12\. Git Hooks & Code Quality

### Pre-commit

- ESLint must pass
- Prettier formatting applied
- Commit blocked on failure

### Enforcement

- Hooks must not be skipped
- CI must re-run lint & build

## 13\. Mandatory Rules (Non-Negotiable)

- Joi validation on all APIs
- Winston logging only
- Centralized error handling
- tsc build must pass
- Folder structure must not be altered

## 14\. Recommended Enhancements

- OpenAPI generation
- Docker support
- CI pipelines
- Authentication baseline
- Observability integration

## 15\. Versioning & Ownership

- Template changes must be versioned
- Breaking changes require migration notes
- Platform team owns this standard

## 16\. Conclusion

This template is the **single source of truth** for backend service development in the company. Consistent adoption ensures maintainability, security, and developer productivity at scale.
