// src/functions/dora/metrics.js

const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

const ENVIRONMENT = process.env.ENVIRONMENT;
const METRIC_NAMESPACE = process.env.DORA_METRICS_NAMESPACE;

const putMetric = async (name, value, unit = "Count", dimensions = {}) => {
  const timestamp = new Date();
  console.log(`Putting metric ${name} at timestamp ${timestamp.toISOString()}`);

  // Ensure timestamp is rounded to nearest minute
  timestamp.setSeconds(0, 0);

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
        Timestamp: timestamp,
        Dimensions: metricDimensions,
        StorageResolution: 60,
      },
    ],
    Namespace: METRIC_NAMESPACE,
  };

  console.log("CloudWatch Parameters:", JSON.stringify(params, null, 2));

  try {
    await cloudwatch.putMetricData(params).promise();
    console.log(`Successfully put metric ${name}`);
    return true;
  } catch (error) {
    console.error(`Error putting metric ${name}:`, error);
    throw error;
  }
};

const processDeploymentSuccess = async (event) => {
  if (ENVIRONMENT === "prod") {
    try {
      // Record deployment frequency
      await putMetric("DeploymentFrequency", 1, "Count");

      // Calculate lead time
      const commitTime = new Date(event.detail.commitTime);
      const deployTime = new Date(event.time);
      const leadTimeSeconds = Math.round((deployTime - commitTime) / 1000);

      console.log("Lead time calculation:", {
        commitTime: commitTime.toISOString(),
        deployTime: deployTime.toISOString(),
        leadTimeSeconds,
      });

      await putMetric("LeadTimeForChanges", leadTimeSeconds, "Seconds");
    } catch (error) {
      console.error("Error processing deployment success:", error);
      throw error;
    }
  }
};

const processDeploymentFailure = async (event) => {
  if (ENVIRONMENT === "prod") {
    try {
      // Record deployment failure
      await putMetric("DeploymentFailures", 1, "Count");
      // Record incident start time for MTTR
      await putMetric("IncidentStart", 1, "Count", {
        IncidentId: event.detail.deploymentId,
      });
    } catch (error) {
      console.error("Error processing deployment failure:", error);
      throw error;
    }
  }
};

const processIncidentResolve = async (event) => {
  if (ENVIRONMENT === "prod") {
    try {
      const incidentId = event.detail.incidentId;
      const resolveTime = new Date(event.time);
      const startTime = new Date(event.detail.startTime);

      // Calculate MTTR in minutes
      const mttrMinutes = Math.round((resolveTime - startTime) / (1000 * 60));

      await putMetric("MTTR", mttrMinutes, "Minutes", {
        IncidentId: incidentId,
      });
    } catch (error) {
      console.error("Error processing incident resolve:", error);
      throw error;
    }
  }
};

exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    switch (event["detail-type"]) {
      case "deployment_success":
        await processDeploymentSuccess(event);
        break;
      case "deployment_failure":
        await processDeploymentFailure(event);
        break;
      case "incident_resolve":
        await processIncidentResolve(event);
        break;
      default:
        console.log(`Unhandled detail-type: ${event["detail-type"]}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Successfully processed metrics" }),
    };
  } catch (error) {
    console.error("Error in handler:", error);
    throw error;
  }
};
