const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  try {
    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "DeploymentFrequency",
            Value: 1, // Increment the deployment count
            Unit: "Count",
          },
        ],
      })
      .promise();

    console.log("DeploymentFrequency metric updated.");
  } catch (error) {
    console.error("Error updating DeploymentFrequency metric:", error);
    throw error;
  }
};
