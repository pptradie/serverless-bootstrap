// src/functions/dora/metrics.js

const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

const ENVIRONMENT = process.env.ENVIRONMENT;
const METRIC_NAMESPACE = process.env.DORA_METRICS_NAMESPACE;

// Validation utilities
const validateMetricValue = (value, metricName) => {
  if (typeof value !== "number" || isNaN(value)) {
    throw new Error(`Invalid value for metric ${metricName}: ${value}`);
  }
  return true;
};

const validateTimestamp = (timestamp) => {
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid timestamp: ${timestamp}`);
  }
  return date;
};

const calculateTimeInMinutes = (startTime, endTime) => {
  const start = validateTimestamp(startTime);
  const end = validateTimestamp(endTime);
  return Math.round((end - start) / (1000 * 60)); // Convert to minutes
};

const putMetric = async (name, value, unit = "Count", dimensions = {}) => {
  validateMetricValue(value, name);

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
      // Record deployment frequency with metadata
      await putMetric("DeploymentFrequency", 1, "Count", {
        CommitId: event.detail.commitId,
        Branch: event.detail.branch,
      });

      // Calculate lead time from change start to deployment
      const changeStartTime = event.detail.changeStartTime;
      const deployTime = event.time;
      const leadTimeMinutes = calculateTimeInMinutes(
        changeStartTime,
        deployTime
      );

      console.log("Lead time calculation:", {
        changeStartTime,
        deployTime,
        leadTimeMinutes,
      });

      await putMetric("LeadTimeForChanges", leadTimeMinutes, "Minutes", {
        CommitId: event.detail.commitId,
        PullRequest: event.detail.pullRequestNumber || "direct-push",
      });

      await putMetric("SuccessfulDeployments", 1, "Count", {
        DeploymentId: event.detail.deploymentId,
      });
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
      await putMetric("DeploymentFailures", 1, "Count", {
        DeploymentId: event.detail.deploymentId,
        CommitId: event.detail.commitId,
        Severity: event.detail.severity,
      });

      // Create a production incident for the deployment failure
      await processProductionIncident({
        ...event,
        detail: {
          ...event.detail,
          type: "deployment_failure",
          incidentId: event.detail.deploymentId,
        },
      });
    } catch (error) {
      console.error("Error processing deployment failure:", error);
      throw error;
    }
  }
};

const processProductionIncident = async (event) => {
  if (ENVIRONMENT === "prod") {
    try {
      await putMetric("ProductionIncidents", 1, "Count", {
        IncidentType: event.detail.type,
        Severity: event.detail.severity,
        RelatedDeployment: event.detail.deploymentId,
      });

      // Record incident start time for MTTR
      await putMetric("IncidentStart", 1, "Count", {
        IncidentId: event.detail.incidentId,
        IncidentType: event.detail.type,
        Severity: event.detail.severity,
        ImpactedServices: event.detail.impactedServices?.join(",") || "unknown",
      });
    } catch (error) {
      console.error("Error processing production incident:", error);
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
      const mttrMinutes = Math.round((resolveTime - startTime) / (1000 * 60));

      // Add more detailed incident tracking
      await putMetric("MTTR", mttrMinutes, "Minutes", {
        IncidentId: incidentId,
        IncidentType: event.detail.type,
        Severity: event.detail.severity,
        ResolutionMethod: event.detail.resolutionMethod,
        ImpactedServices: event.detail.impactedServices,
      });

      // Track resolution types for analysis
      await putMetric("IncidentResolutions", 1, "Count", {
        ResolutionType: event.detail.resolutionMethod,
        IncidentType: event.detail.type,
      });

      // Record successful resolution
      await putMetric("IncidentResolves", 1, "Count", {
        IncidentId: incidentId,
        IncidentType: event.detail.type,
        ResolutionMethod: event.detail.resolutionMethod,
        MTTR: mttrMinutes,
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

    if (!event["detail-type"] || !event.detail) {
      throw new Error("Invalid event structure");
    }

    switch (event["detail-type"]) {
      case "deployment_start":
        console.log("Deployment start event received");
        break;
      case "deployment_success":
        await processDeploymentSuccess(event);
        break;
      case "deployment_failure":
        await processDeploymentFailure(event);
        break;
      case "incident_start":
        await processProductionIncident(event);
        break;
      case "incident_resolve":
        await processIncidentResolve(event);
        break;
      default:
        console.log(`Unhandled detail-type: ${event["detail-type"]}`);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "Successfully processed metrics",
        eventType: event["detail-type"],
      }),
    };
  } catch (error) {
    console.error("Error in handler:", error);
    throw error;
  }
};
