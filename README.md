# SoFlix Server

## Overview

A Node.JS application for watching videos with friends in real-time. Synchronizes video players between different users.
   * Create Video Rooms and Play Shared Videos
   * Authenticate with Facebook
   * Convert videos into different bitrate formats using AWS Elastic Transcoder
   * Chat with Friends, Set up/revoke permissions
   

## Prerequisites

   * Node V0.8+
   * MongoDB server
   
## Setting up the app

   * Run `npm install` at the root folder to download dependencies.
   * Make sure Mongo server is running. After following [instructions to install](http://docs.mongodb.org/manual/installation/), you can start it by sudo mongod which starts at localhost:27017 with default configurations. The app creates a database called `paypal_pizza` by default.
   * Copy `aws-config-example.json` to `config.json` and populate with proper AWS credentials 
   * Copy `constants.example.js` to `constants.js` and populate with proper settings
   * **If you use port 80, you must run the node process as root** *
   * Navigate to HOSTNAME/api/ and test the different routes
   * Deploy *soflix-client* in the proper `CLIENT_PATH` to see a working version

## Configuration

   Please see `constants.js` in the root folder if you want to change the default application / mongo settings.
   
## References 
   * SoFlix Client - https://github.com/tewebsolutions/soflix-client
   * Github repository for Node.js REST API SDK - https://github.com/paypal/rest-api-sdk-nodejs