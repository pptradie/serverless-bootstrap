const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { commitTime, deploymentTime } = event.detail;

  try {
    // Calculate lead time in milliseconds and convert to seconds
    const leadTime = (new Date(deploymentTime) - new Date(commitTime)) / 1000; // Convert ms to seconds

    // Publish the metric to CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "LeadTimeForChanges",
            Value: leadTime,
            Unit: "Seconds", // Use valid unit 'Seconds'
          },
        ],
      })
      .promise();

    console.log("LeadTimeForChanges metric updated.");
  } catch (error) {
    console.error("Error updating LeadTimeForChanges metric:", error);
    throw error;
  }
};
