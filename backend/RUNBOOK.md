# Backend Runbook

This runbook provides instructions for managing the backend service.

## Restarting the Backend

To restart the backend, follow these steps:

1.  SSH into the server where the backend is running.
2.  Navigate to the backend directory: `cd /path/to/your/backend`
3.  Stop the current running process. You can find the process ID (PID) by running `ps aux | grep "node server.js"` and then kill the process using `kill <PID>`.
4.  Start the server again: `npm start`

## Rolling Back to a Previous Version

To roll back to a previous version of the backend, you can use git to check out a previous commit.

1.  SSH into the server where the backend is running.
2.  Navigate to the backend directory: `cd /path/to/your/backend`
3.  Stop the current running process (see "Restarting the Backend").
4.  Fetch the latest changes from the git repository: `git fetch`
5.  Find the commit hash of the version you want to roll back to by looking at the git log: `git log`
6.  Check out the desired commit: `git checkout <commit-hash>`
7.  Install the dependencies for that version: `npm install`
8.  Start the server again: `npm start`

## Monitoring

The backend exposes a `/metrics` endpoint with Prometheus metrics.

To view the metrics, you can access `http://<backend-host>:<port>/metrics`.

The following metrics are available:

*   `up`: 1 if the process is up, 0 otherwise.
*   `http_requests_total`: Total number of HTTP requests.
*   `http_requests_duration_seconds`: Duration of HTTP requests in seconds.

These metrics can be scraped by a Prometheus server for monitoring and alerting.

## Alerting

To set up alerting for high error rates, you can use Prometheus and Alertmanager. Here is an example of a Prometheus alert rule that fires when the rate of 5xx errors is greater than 5% for 5 minutes:

```yaml
groups:
- name: example
  rules:
  - alert: HighErrorRate
    expr: (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.05
    for: 5m
    labels:
      severity: page
    annotations:
      summary: High error rate
      description: The error rate is greater than 5% for 5 minutes.
```

This rule should be added to your Prometheus configuration. You will also need to configure Alertmanager to send notifications to your desired notification channels (e.g., Slack, PagerDuty).

