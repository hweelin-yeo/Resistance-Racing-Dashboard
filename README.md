# SEM-DAQ-Frontend
Shell Eco Marathon: Data Acquisition Unit Frontend, i.e. web-based dashboard

# Getting started

To get the Node server running locally:

Clone this repo

npm install to install all required dependencies

Use https://intense-dawn-73114.herokuapp.com/ (/webhooks, /db)

Type “heroku logs -t” in terminal to view console log and git commits

# Developing

Run `node index.js` to start the server

Go to `localhost:5000/live` for the Live Timing Dashboard

Go to `localhost:5000/user-test` for the Speed Control user test

# Code Overview

Dependencies

expressjs - The server for handling and routing HTTP requests

pg - PostgreSQL database

# Application Structure

index.js - The entry point to our application. 


