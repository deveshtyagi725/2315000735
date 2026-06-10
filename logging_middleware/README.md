# logging_middleware

Express middleware that logs incoming requests with method, URL, status code and response time.

## Usage

```js
const express = require("express")
const logger = require("./index")

const app = express()
app.use(logger)
```

## Output format

```
[2025-07-14T10:30:00.000Z] GET /notifications 200 12ms
```

## Run test

```bash
npm install
npm test
```
