const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { commitTime, deploymentTime } = event.detail;

  try {
    const leadTime = new Date(deploymentTime) - new Date(commitTime); // Time in ms
    const leadTimeMinutes = leadTime / 60000; // Convert ms to minutes

    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "LeadTimeForChanges",
            Value: leadTimeMinutes,
            Unit: "Minutes",
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
