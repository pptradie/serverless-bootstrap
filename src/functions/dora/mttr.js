const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { startTime, resolutionTime } = event.detail;

  try {
    // Calculate recovery time in milliseconds and convert to seconds
    const recoveryTime =
      (new Date(resolutionTime) - new Date(startTime)) / 1000; // Convert ms to seconds

    // Publish the metric to CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "MTTR",
            Value: recoveryTime,
            Unit: "Seconds", // Use valid unit 'Seconds'
          },
        ],
      })
      .promise();

    console.log("MTTR metric updated.");
  } catch (error) {
    console.error("Error updating MTTR metric:", error);
    throw error;
  }
};
