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

## POST /datasets

## GET /datasets/:datasetId

## PUT /datasets/:datasetId

## DELETE /datasets/:datasetId

## GET /datasets/:datasetId/metrics/:metricId

## DELETE /datasets/:datasetId/metrics/:metricId

# How to deploy