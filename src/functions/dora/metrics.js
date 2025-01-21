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
        StorageResolution: 60, // Standard resolution (1 minute)
      },
    ],
    Namespace: METRIC_NAMESPACE,
  };

  console.log("CloudWatch Parameters:", JSON.stringify(params, null, 2));

  try {
    await cloudwatch.putMetricData(params).promise();
    console.log(`Successfully put metric ${name}`);

    // Wait briefly before verification
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // Verify metric was stored
    const verifyParams = {
      Namespace: METRIC_NAMESPACE,
      MetricName: name,
      Dimensions: metricDimensions,
      StartTime: new Date(timestamp.getTime() - 5 * 60 * 1000),
      EndTime: new Date(timestamp.getTime() + 5 * 60 * 1000),
      Period: 60,
      Statistics: ["Sum", "Average"],
    };

    const verifyResult = await cloudwatch
      .getMetricStatistics(verifyParams)
      .promise();
    console.log(
      `Verification result for ${name}:`,
      JSON.stringify(verifyResult, null, 2)
    );

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
  } else {
    console.log(`Skipping metrics for environment: ${ENVIRONMENT}`);
  }
};

exports.handler = async (event) => {
  try {
    console.log("Received event:", JSON.stringify(event, null, 2));

    switch (event["detail-type"]) {
      case "deployment_success":
        await processDeploymentSuccess(event);
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
