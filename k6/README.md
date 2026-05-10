# k6 Load Testing

Load tests for the backend Google Drive verification flow.

- Script: `k6/drive-verify-scenarios.js`
- Samples: `k6/drive-verify-samples.json`
- Endpoint under test: `POST /api/submissions/verify-drive-file`
- Auth used: `POST /api/auth/sign-in`

## Test Assets

[Drive Validation Test Assets](https://drive.google.com/drive/folders/1GNUinOKovG0eV3hKQpqdH9Vljb-fc280?usp=sharing)

## Requirements

- `k6` installed
- backend running with GOOGLE_DRIVE_API_KEY configured

## Environment Variables

Required:

- `K6_EMAIL`
- `K6_PASSWORD`

Common:

- `K6_BASE_URL`
  Default: `http://localhost:4000/api`
- `K6_SAMPLE_KEY`
  Default: `image_a1_portrait`
- `K6_MODE`
  One of: `smoke`, `single-burst`, `repeated-bursts`, `quota-push`

Mode-specific:

- `single-burst`: `K6_VUS`, `K6_MAX_DURATION`
- `repeated-bursts`: `K6_BURST_RATE`, `K6_PREALLOCATED_VUS`, `K6_MAX_VUS`, `K6_UP_DURATION`, `K6_DOWN_DURATION`
- `quota-push`: `K6_RATE`, `K6_DURATION`, `K6_PREALLOCATED_VUS`, `K6_MAX_VUS`

## Modes

- `smoke`
  Low-volume end-to-end correctness check.
- `single-burst`
  Many users verify at the same time.
- `repeated-bursts`
  Repeated traffic waves with cooldown periods.
- `quota-push`
  Sustained traffic to surface latency, throttling, and anti-automation behavior.

## Run

Run from the backend repo root.

Smoke:

```powershell
$env:K6_EMAIL="admin@skylab.com"
$env:K6_PASSWORD="your-password"
$env:K6_MODE="smoke"
$env:K6_SAMPLE_KEY="image_a1_portrait"
k6 run ".\k6\drive-verify-scenarios.js"
```

Single burst:

```powershell
$env:K6_EMAIL="admin@skylab.com"
$env:K6_PASSWORD="your-password"
$env:K6_MODE="single-burst"
$env:K6_SAMPLE_KEY="image_a1_portrait"
$env:K6_VUS="100"
k6 run ".\k6\drive-verify-scenarios.js"
```

Repeated bursts:

```powershell
$env:K6_EMAIL="admin@skylab.com"
$env:K6_PASSWORD="your-password"
$env:K6_MODE="repeated-bursts"
$env:K6_SAMPLE_KEY="image_a1_portrait"
$env:K6_BURST_RATE="20"
$env:K6_PREALLOCATED_VUS="30"
$env:K6_MAX_VUS="60"
k6 run ".\k6\drive-verify-scenarios.js"
```

Quota push:

```powershell
$env:K6_EMAIL="admin@skylab.com"
$env:K6_PASSWORD="your-password"
$env:K6_MODE="quota-push"
$env:K6_SAMPLE_KEY="image_a1_portrait"
$env:K6_RATE="10"
$env:K6_DURATION="2m"
$env:K6_PREALLOCATED_VUS="20"
$env:K6_MAX_VUS="40"
k6 run ".\k6\drive-verify-scenarios.js"
```

## Thresholds

- `http_req_failed: rate < 0.5`
- `http_req_duration: p(95) < 5000`
