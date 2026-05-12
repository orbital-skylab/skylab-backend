import http from "k6/http";
import { check, sleep } from "k6";
import exec from "k6/execution";

const samples = JSON.parse(open("./drive-verify-samples.json"));

const BASE_URL = __ENV.K6_BASE_URL || "http://localhost:4000/api";
const EMAIL = __ENV.K6_EMAIL || "";
const PASSWORD = __ENV.K6_PASSWORD || "";
const SAMPLE_KEY = __ENV.K6_SAMPLE_KEY || "image_a1_portrait";
const MODE = (__ENV.K6_MODE || "smoke").toLowerCase();

const sample = samples[SAMPLE_KEY];

if (!sample) {
  throw new Error(
    `Unknown K6_SAMPLE_KEY "${SAMPLE_KEY}". Available keys: ${Object.keys(
      samples
    ).join(", ")}`
  );
}

function buildOptions() {
  switch (MODE) {
    case "single-burst":
      return {
        scenarios: {
          single_burst: {
            executor: "per-vu-iterations",
            vus: Number(__ENV.K6_VUS || 50),
            iterations: 1,
            maxDuration: __ENV.K6_MAX_DURATION || "30s",
          },
        },
      };
    case "repeated-bursts":
      return {
        scenarios: {
          repeated_bursts: {
            executor: "ramping-arrival-rate",
            startRate: 0,
            timeUnit: "1s",
            preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 50),
            maxVUs: Number(__ENV.K6_MAX_VUS || 100),
            stages: [
              {
                target: Number(__ENV.K6_BURST_RATE || 25),
                duration: __ENV.K6_UP_DURATION || "10s",
              },
              {
                target: 0,
                duration: __ENV.K6_DOWN_DURATION || "10s",
              },
              {
                target: Number(__ENV.K6_BURST_RATE || 25),
                duration: __ENV.K6_UP_DURATION || "10s",
              },
              {
                target: 0,
                duration: __ENV.K6_DOWN_DURATION || "10s",
              },
              {
                target: Number(__ENV.K6_BURST_RATE || 25),
                duration: __ENV.K6_UP_DURATION || "10s",
              },
              {
                target: 0,
                duration: __ENV.K6_DOWN_DURATION || "10s",
              },
            ],
          },
        },
      };
    case "quota-push":
      return {
        scenarios: {
          quota_push: {
            executor: "constant-arrival-rate",
            rate: Number(__ENV.K6_RATE || 30),
            timeUnit: "1s",
            duration: __ENV.K6_DURATION || "2m",
            preAllocatedVUs: Number(__ENV.K6_PREALLOCATED_VUS || 80),
            maxVUs: Number(__ENV.K6_MAX_VUS || 150),
          },
        },
      };
    case "smoke":
    default:
      return {
        scenarios: {
          smoke: {
            executor: "shared-iterations",
            vus: 1,
            iterations: 1,
            maxDuration: "30s",
          },
        },
      };
  }
}

export const options = {
  ...buildOptions(),
  thresholds: {
    http_req_failed: ["rate<0.5"],
    http_req_duration: ["p(95)<5000"],
  },
};

function extractTokenCookie(setCookieHeaders) {
  if (!setCookieHeaders) return null;

  const headers = Array.isArray(setCookieHeaders)
    ? setCookieHeaders
    : [setCookieHeaders];

  for (const header of headers) {
    const match = String(header).match(/token=([^;]+)/);
    if (match) {
      return match[1];
    }
  }

  return null;
}

export function setup() {
  if (!EMAIL || !PASSWORD) {
    throw new Error("Please set K6_EMAIL and K6_PASSWORD.");
  }

  const loginRes = http.post(
    `${BASE_URL}/auth/sign-in`,
    JSON.stringify({
      email: EMAIL,
      password: PASSWORD,
    }),
    {
      headers: {
        "Content-Type": "application/json",
      },
    }
  );

  check(loginRes, {
    "sign in status is 200": (res) => res.status === 200,
  });

  const token = extractTokenCookie(loginRes.headers["Set-Cookie"]);

  if (!token) {
    throw new Error(
      `Could not extract token cookie from sign-in response. Status=${loginRes.status} Body=${loginRes.body}`
    );
  }

  return { token };
}

function buildPayload() {
  return {
    url: sample.url,
    urlType: sample.urlType,
    urlValidationRules: sample.urlValidationRules,
  };
}

export default function (data) {
  const payload = buildPayload();
  const res = http.post(
    `${BASE_URL}/submissions/verify-drive-file`,
    JSON.stringify(payload),
    {
      headers: {
        "Content-Type": "application/json",
        Cookie: `token=${data.token}`,
      },
      tags: {
        mode: MODE,
        sample_key: SAMPLE_KEY,
        sample_type: sample.urlType,
      },
    }
  );

  let body = {};
  try {
    body = res.json();
  } catch {
    body = {};
  }

  check(res, {
    "verify endpoint responded": (response) => response.status !== 0,
    "verify endpoint not 5xx": (response) => response.status < 500,
  });

  check(body, {
    "verified flag matches expectation": (response) =>
      response?.verified === sample.expectedVerified,
    "message loosely matches expectation": (response) =>
      !sample.expectedMessageContains ||
      String(response?.message || "")
        .toLowerCase()
        .includes(String(sample.expectedMessageContains).toLowerCase()),
  });

  if (res.status >= 400 || body?.verified !== sample.expectedVerified) {
    console.log(
      JSON.stringify({
        mode: MODE,
        sampleKey: SAMPLE_KEY,
        status: res.status,
        verified: body?.verified,
        message: body?.message,
        iteration: exec.scenario.iterationInTest,
      })
    );
  }

  if (MODE === "smoke") {
    sleep(0.2);
  }
}
