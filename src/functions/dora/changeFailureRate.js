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
            MetricName: "ChangeFailureRate",
            Value: 1, // Increment failure count
            Unit: "Count",
          },
        ],
      })
      .promise();

    console.log("ChangeFailureRate metric updated.");
  } catch (error) {
    console.error("Error updating ChangeFailureRate metric:", error);
    throw error;
  }
};
