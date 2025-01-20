// src/functions/dora/metrics.js

const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

// Environment constants
const ENVIRONMENT = process.env.ENVIRONMENT;
const METRIC_NAMESPACE = process.env.DORA_METRICS_NAMESPACE;

/**
 * Sends a metric to CloudWatch with standard dimensions
 * @param {string} name - Metric name
 * @param {number} value - Metric value
 * @param {string} unit - Metric unit (default: Count)
 * @param {Object} dimensions - Additional dimensions beyond Environment
 */
const putMetric = async (name, value, unit = "Count", dimensions = {}) => {
  // Convert dimensions object to CloudWatch format
  const metricDimensions = [
    { Name: "Environment", Value: ENVIRONMENT },
    ...Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: String(value),
    })),
  ];

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

  return cloudwatch.putMetricData(params).promise();
};

/**
 * Processes deployment start events
 * Records the start of a deployment for timing calculations
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
 * Records deployment frequency and calculates lead time
 */
const processDeploymentSuccess = async (event) => {
  if (ENVIRONMENT === "production") {
    // Increment deployment count
    await putMetric("DeploymentFrequency", 1);

    // Calculate and record lead time
    const commitTime = new Date(event.detail.commitTime).getTime();
    const deployTime = new Date().getTime();
    const leadTimeMinutes = (deployTime - commitTime) / (1000 * 60);

    await putMetric("LeadTimeForChanges", leadTimeMinutes, "Minutes");
  }
};

/**
 * Processes deployment failures
 * Records failed deployments for change failure rate calculation
 */
const processDeploymentFailure = async () => {
  if (ENVIRONMENT === "production") {
    await putMetric("DeploymentFailure", 1);
  }
};

/**
 * Processes incident start events
 * Records when production incidents begin
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
 * Records incident resolution for MTTR calculation
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
 * Routes events to appropriate processors based on detail-type
 */
exports.handler = async (event) => {
  try {
    // Route event to appropriate processor
    switch (event["detail-type"]) {
      case "deployment_start":
        await processDeploymentStart(event);
        break;
      case "deployment_success":
        await processDeploymentSuccess(event);
        break;
      case "deployment_failure":
        await processDeploymentFailure();
        break;
      case "incident_start":
        await processIncidentStart(event);
        break;
      case "incident_resolve":
        await processIncidentResolve(event);
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Metrics processed successfully" }),
    };
  } catch (error) {
    // Using console.error is allowed per ESLint config
    console.error("Error processing metrics:", error);
    throw error;
  }
};
