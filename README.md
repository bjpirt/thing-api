# Thing API

This is a simple API designed with the following goals in mind:

- lightweight - runs in AWS serverless so no services to manage
- simple - it's just a ReST API with JSON
- scalable - runs on AWS lambda with DynamoDB
- cost-effective - for personal use it should fall within the AWS free tier usage

It's written in Typescript and is well-tested using Jest.

# API Docs

Conceptually, there are two main types of object in the API:

- Metrics - a single time-series collection of time:value pairs
- Datasets - a collection of Metrics

## Metric

## Dataset

## GET /datasets

Make a `GET` request to `/datasets` to retrieve all of the datasets for the user in the auth token:

```JSON

{
  "datasets": [
    {
      "id": "ah6dmn8SNp",
      "name": "Name of Dataset 1",
      "metrics": {
        "metricOne": {
          "description": "Longer description for metric one",
          "unit": "W"
        }
      }
    },
    {
      "id": "fpqlM7FspJ",
      "name": "Name of Dataset 2",
      "metrics": {
        "metricOne": {
          "description": "Longer description for metric one",
          "unit": "W"
        }
      }
    }
  ]
}

```

## POST /datasets

Make a POST request to `/datasets` with the following JSON structure:

```JSON

{
  "name": "Name of Dataset",
  "description": "Longer description here (optional)",
  "metrics": {
    "metricOne": {
      "description": "Longer description for metric one",
      "unit": "W"
    },
    "metricTwo": {
      "description": "Longer description for metric two",
      "unit": "C"
    }
  }
}

```

You will receive a `201` status code if the request is successful and a `Location` header pointing to the URL for the dataset. You should use this to retrieve the ID for the Dataset to use in any future requests.

## GET /datasets/:datasetId

Make a `GET` request to `/datasets/:datasetId` to retrieve an individual dataset:

```JSON
{
  "id": "ah6dmn8SNp",
  "name": "Name of Dataset 1",
  "metrics": {
    "metricOne": {
      "description": "Longer description for metric one",
      "unit": "W"
    }
  }
}
```

## PUT /datasets/:datasetId

This will update the existing dataset. You can use it to update the metadata attributes (name, description, etc) but its main use is to set the values of the metrics. This will store them in the history for later retrieval.

Make a `PUT` request to `/datasets/:id` with the following JSON structure:

```JSON

{
  "metrics": {
    "metricOne": {
      "value": 123,
      "time": "2023-01-08T15:50:56.000Z"
    },
    "metricTwo": {
      "value": 321,
      "time": "2023-01-08T15:50:56.000Z"
    }
  }
}

```

Some notes:

- You can omit the timestamp and the server will use the current time.
- The metric value filed is numeric only
- The timestamp accuracy is to the second. Subseconds will be discarded.

## DELETE /datasets/:datasetId

Make a `DELETE` request to `/datasets/:datasetId` to delete an individual dataset.

## GET /datasets/:datasetId/metrics/:metricId

Use this API endpoint to get the history for a single metric. Make a `GET` request to `/datasets/:datasetId/metrics/:metricId` with `start` and `end` parameters of timestamps to receive the historical values (inclusive). For example:

`GET /datasets/ad7n3J2pw9/metrics/metricOne?start=2023-01-08T10:00:00Z&end=2023-01-08T11:00:00Z`

returns

```JSON

{
  "metrics": [
    {
      "time": "2023-01-08T10:00:00Z",
      "value": 1
    },
    {
      "time": "2023-01-08T10:15:00Z",
      "value": 2
    },
    {
      "time": "2023-01-08T10:30:00Z",
      "value": 3
    },
    {
      "time": "2023-01-08T10:45:00Z",
      "value": 4
    },
    {
      "time": "2023-01-08T11:00:00Z",
      "value": 5
    }
  ]
}

```

## DELETE /datasets/:datasetId/metrics/:metricId

Make a `DELETE` request to `/datasets/:datasetId/metrics/:metricId` to delete an individual metric from a dataset. Note: the metric data is not currently removed from Dynamo.

## POST /datasets/:datasetId/tokens

This creates an authentication token that can be used to perform actions on only this dataset. It is possible to configure this token to only allow certain methods (`GET`, `POST`, `PUT`,`DELETE`) or all methods (`*`). These token do not expire because they are designed to be long lived and used on devices. It is possible to expire a token by deleting it.

Make a `POST` request to `/datasets/:datasetId/tokens` with the following JSON data structure:

```JSON
{
  "name": "Human readable token name so you can remember what it's for",
  "methods": [
    "GET",
    "PUT"
  ]
}
```

It returns an authentication token to use with the following JSON response:

```JSON
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InVzZXIiLCJ1c2VyIjoiYWRtaW4iLCJpYXQiOjE2NzMxOTM1NzksImV4cCI6MTY3MzI3OTk3OX0.D35omt0ZrKBiIVe-_GPzFAxK6Mq7PhLCiHLlv_WMN7E"
}
```

Note that for security reasons it is not possible to retrieve these tokens again in the future.

## GET /datasets/:datasetId/tokens

Make a `GET` request to `/datasets/:datasetid/tokens` to retrive the tokens for that dataset in the following format:

```JSON
{
  "tokens": [
    {
      "id": "abcde12345",
      "name": "Human readable token name so you can remember what it's for",
      "createdAt": "2023-01-14T21:57:03.000Z",
      "methods": [
        "GET",
        "PUT"
      ]
    }
  ]
}
```

Note this does not return the actual auth token, just a reference to it so that you can delete it if it needs revoking.

## DELETE /datasets/:datasetId/tokens/:tokenId

Make a `DELETE` request to `/datasets/:datasetId/tokens/:tokenId` to delete (and therby revoke) a token to it can no longer be used to make requests

## POST /login

This is used to log in with your user name and password and retrieve a token to use with the rest of the API. The current implementation is single user and this is configured via environment variables.

Make a `POST` request to `/login` with the following JSON:

```JSON

{
  "user": "admin",
  "password": "password"
}

```

If successful you will receive a token to use for the API (valid for one day) as follows:

```JSON

{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzY29wZSI6InVzZXIiLCJ1c2VyIjoiYWRtaW4iLCJpYXQiOjE2NzMxOTM1NzksImV4cCI6MTY3MzI3OTk3OX0.D35omt0ZrKBiIVe-_GPzFAxK6Mq7PhLCiHLlv_WMN7E"
}

```

# How to deploy

# To Do

The project is still working towards the MVP and there are a number of items still on the To Do list:

_MVP_

- [x] User login
- [x] Authentication with token from login
- [x] Tokens API for datasets
- [ ] Basic user interface

_Future_

- [ ] Alerts / webhooks
- [ ] MQTT / AWS IoT integration
- [ ] Multiple users
- [ ] Configurable retention periods for metric data
- [ ] Downsampling of metric data with retention periods
- [ ] Time-series statistical calculations
