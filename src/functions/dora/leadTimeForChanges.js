const AWS = require("aws-sdk");
const cloudwatch = new AWS.CloudWatch();

module.exports.handler = async (event) => {
  console.log("Event received:", JSON.stringify(event, null, 2));

  const { commitTime, deploymentTime } = event.detail;

  try {
    // Validate input times
    if (!commitTime || !deploymentTime) {
      throw new Error(
        `Invalid input data: commitTime=${commitTime}, deploymentTime=${deploymentTime}`
      );
    }

    const commitDate = new Date(commitTime);
    const deploymentDate = new Date(deploymentTime);

    if (isNaN(commitDate.getTime()) || isNaN(deploymentDate.getTime())) {
      throw new Error(
        `Invalid date values: commitDate=${commitDate}, deploymentDate=${deploymentDate}`
      );
    }

    // Calculate lead time in seconds
    const leadTime = (deploymentDate - commitDate) / 1000; // Convert ms to seconds

    // Publish the metric to CloudWatch
    await cloudwatch
      .putMetricData({
        Namespace: process.env.DORA_METRICS_NAMESPACE,
        MetricData: [
          {
            MetricName: "LeadTimeForChanges",
            Value: leadTime,
            Unit: "Seconds",
          },
        ],
      })
      .promise();

    console.log(
      `LeadTimeForChanges metric updated successfully: ${leadTime} seconds`
    );
  } catch (error) {
    console.error("Error updating LeadTimeForChanges metric:", error.message);
    throw error;
  }
};
