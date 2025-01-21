const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { startTime, resolutionTime } = event.detail;

  try {
    const recoveryTime = new Date(resolutionTime) - new Date(startTime); // Time in ms
    const recoveryTimeHours = recoveryTime / 3600000; // Convert ms to hours

    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "MTTR",
            Value: recoveryTimeHours,
            Unit: "Hours",
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
