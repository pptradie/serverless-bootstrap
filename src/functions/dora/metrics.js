// src/functions/dora/metrics.js

const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

// Environment constants
const ENVIRONMENT = process.env.ENVIRONMENT;
const METRIC_NAMESPACE = process.env.DORA_METRICS_NAMESPACE;

const putMetric = async (name, value, unit = "Count", dimensions = {}) => {
  console.log("==== METRIC DEBUG START ====");
  console.log("Current Environment:", ENVIRONMENT);
  console.log("Metric Namespace:", METRIC_NAMESPACE);
  console.log("Metric Name:", name);
  console.log("Metric Value:", value);
  console.log("Metric Unit:", unit);
  console.log("Current Time:", new Date().toISOString());

  // Convert dimensions object to CloudWatch format
  const metricDimensions = [
    { Name: "Environment", Value: ENVIRONMENT },
    ...Object.entries(dimensions).map(([name, value]) => ({
      Name: name,
      Value: String(value),
    })),
  ];

  console.log("Metric Dimensions:", JSON.stringify(metricDimensions, null, 2));

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

  console.log("Full CloudWatch Params:", JSON.stringify(params, null, 2));

  try {
    const result = await cloudwatch.putMetricData(params).promise();
    console.log("CloudWatch API Response:", JSON.stringify(result, null, 2));

    // Verify the metric was stored
    const verifyParams = {
      Namespace: METRIC_NAMESPACE,
      MetricName: name,
      Dimensions: metricDimensions,
      StartTime: new Date(Date.now() - 5 * 60 * 1000), // Last 5 minutes
      EndTime: new Date(),
      Period: 60,
      Statistics: ["Sum", "Average", "Minimum", "Maximum"],
    };

    console.log(
      "Verification Query Params:",
      JSON.stringify(verifyParams, null, 2)
    );

    try {
      const verifyResult = await cloudwatch
        .getMetricStatistics(verifyParams)
        .promise();
      console.log(
        "Verification Result:",
        JSON.stringify(verifyResult, null, 2)
      );
      if (verifyResult.Datapoints.length === 0) {
        console.warn("No datapoints found in verification!");
      }
    } catch (verifyError) {
      console.error("Verification failed:", verifyError);
    }

    console.log("==== METRIC DEBUG END ====");
    return result;
  } catch (error) {
    console.error("Error putting metric:", JSON.stringify(error, null, 2));
    throw error;
  }
};

const processDeploymentSuccess = async (event) => {
  console.log(
    "Processing deployment success event:",
    JSON.stringify(event, null, 2)
  );

  if (ENVIRONMENT === "prod" || ENVIRONMENT === "production") {
    console.log(`Environment matches (${ENVIRONMENT}), processing metrics...`);

    // Increment deployment count
    await putMetric("DeploymentFrequency", 1, "Count");

    // Calculate and record lead time
    const commitTime = new Date(event.detail.commitTime).getTime();
    const deployTime = new Date(event.time).getTime();
    const leadTimeSeconds = (deployTime - commitTime) / 1000;

    console.log("Lead time calculation:", {
      commitTime: event.detail.commitTime,
      deployTime: event.time,
      leadTimeSeconds,
    });

    await putMetric("LeadTimeForChanges", leadTimeSeconds, "Seconds");
  } else {
    console.log(
      `Environment (${ENVIRONMENT}) is not production, skipping metrics`
    );
  }
};

// Rest of your Lambda function code...

exports.handler = async (event) => {
  try {
    console.log("==== LAMBDA EXECUTION START ====");
    console.log("Received event:", JSON.stringify(event, null, 2));
    console.log("Environment variables:", {
      ENVIRONMENT,
      METRIC_NAMESPACE,
    });

    switch (event["detail-type"]) {
      case "deployment_success":
        await processDeploymentSuccess(event);
        break;
      // ... other cases
    }

    console.log("==== LAMBDA EXECUTION END ====");
    return { statusCode: 200, body: "Success" };
  } catch (error) {
    console.error("Lambda execution error:", error);
    throw error;
  }
};
