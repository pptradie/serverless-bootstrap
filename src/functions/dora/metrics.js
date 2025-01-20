// src/functions/dora/metrics.js

const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

// Environment constants
const ENVIRONMENT = process.env.ENVIRONMENT;
const METRIC_NAMESPACE = process.env.DORA_METRICS_NAMESPACE;

// List of valid CloudWatch units for reference
const VALID_UNITS = [
  "Seconds",
  "Microseconds",
  "Milliseconds",
  "Bytes",
  "Kilobytes",
  "Megabytes",
  "Gigabytes",
  "Terabytes",
  "Bits",
  "Kilobits",
  "Megabits",
  "Gigabits",
  "Terabits",
  "Percent",
  "Count",
  "Bytes/Second",
  "Kilobytes/Second",
  "Megabytes/Second",
  "Gigabytes/Second",
  "Terabytes/Second",
  "Bits/Second",
  "Kilobits/Second",
  "Megabits/Second",
  "Gigabits/Second",
  "Terabits/Second",
  "Count/Second",
  "None",
];

/**
 * Sends a metric to CloudWatch with standard dimensions
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Metric unit (default: Count)
 * @param {Object} dimensions - Additional dimensions beyond Environment
 */
const putMetric = async (name, value, unit = "Count", dimensions = {}) => {
  console.log("putMetric:", name, value, unit, dimensions);

  // Convert dimensions object to CloudWatch format
  const metricDimensions = [
    { Name: "Environment", Value: ENVIRONMENT },
    ...Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: String(value),
    })),
  ];

  if (!VALID_UNITS.includes(unit)) {
    console.warn(`Invalid unit "${unit}", defaulting to "Count"`);
    unit = "Count";
  }

  const params = {
    MetricData: [
      {
        MetricName: name,
        Value: value,
        Unit: unit,
        Timestamp: new Date(),
        Dimensions: metricDimensions,
      },
    ],
    Namespace: METRIC_NAMESPACE,
  };

  console.log("Putting metric with params:", JSON.stringify(params, null, 2));

  try {
    const result = await cloudwatch.putMetricData(params).promise();
    console.log("Successfully put metric:", result);
    return result;
  } catch (error) {
    console.error("Error putting metric:", error);
    throw error;
  }
};

/**
 * Processes deployment start events
 */
const processDeploymentStart = async (event) => {
  if (ENVIRONMENT === "production") {
    await putMetric("DeploymentStart", 1, "Count", {
      DeploymentId: event.detail.deploymentId,
    });
  }
};

/**
 * Processes successful deployments
 */
const processDeploymentSuccess = async (event) => {
  if (ENVIRONMENT === "production") {
    // Increment deployment count
    await putMetric("DeploymentFrequency", 1, "Count");

    // Calculate and record lead time
    const commitTime = new Date(event.detail.commitTime).getTime();
    const deployTime = new Date(event.time).getTime();
    const leadTimeSeconds = (deployTime - commitTime) / 1000; // Convert to seconds

    await putMetric("LeadTimeForChanges", leadTimeSeconds, "Seconds");
  }
};

/**
 * Processes deployment failures
 */
const processDeploymentFailure = async () => {
  if (ENVIRONMENT === "production") {
    await putMetric("DeploymentFailure", 1, "Count");
  }
};

/**
 * Processes incident start events
 */
const processIncidentStart = async (event) => {
  if (ENVIRONMENT === "production") {
    await putMetric("IncidentStart", 1, "Count", {
      IncidentId: event.detail.incidentId,
    });
  }
};

/**
 * Processes incident resolution events
 */
const processIncidentResolve = async (event) => {
  if (ENVIRONMENT === "production") {
    await putMetric("IncidentResolve", 1, "Count", {
      IncidentId: event.detail.incidentId,
    });
  }
};

/**
 * Main Lambda handler
 */
exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log("Environment:", ENVIRONMENT);
    console.log("Metric Namespace:", METRIC_NAMESPACE);

    // Route event to appropriate processor
    switch (event["detail-type"]) {
      case "deployment_start":
        console.log("Processing deployment start");
        await processDeploymentStart(event);
        break;
      case "deployment_success":
        console.log("Processing deployment success");
        await processDeploymentSuccess(event);
        break;
      case "deployment_failure":
        console.log("Processing deployment failure");
        await processDeploymentFailure();
        break;
      case "incident_start":
        console.log("Processing incident start");
        await processIncidentStart(event);
        break;
      case "incident_resolve":
        console.log("Processing incident resolve");
        await processIncidentResolve(event);
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Metrics processed successfully" }),
    };
  } catch (error) {
    console.error("Error processing metrics:", error);
    throw error;
  }
};
