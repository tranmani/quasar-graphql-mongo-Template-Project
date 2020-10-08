const express = require('express');
const { ApolloServer } = require('apollo-server-express');
const { makeExecutableSchema, mergeResolvers, mergeTypeDefs } = require('graphql-tools');
const mongoose = require('mongoose');
const http = require("http");
require('dotenv').config();

// Import TypeDefs and Resolvers
const typeDefs = require('./schema/typeDefs');
const authSchema = require('./schema/authentication');
const xmlSchema = require('./schema/xml');
const authResolver = require('./resolvers/authentication');
const xmlResolver = require('./resolvers/xml');

const schema = makeExecutableSchema({
  typeDefs: mergeTypeDefs([typeDefs, authSchema, xmlSchema]),
  resolvers: mergeResolvers([authResolver, xmlResolver])
})

const server = new ApolloServer({
  schema,
  context: async ({ req, connection }) => {
    if (connection) {
      console.log("New Connection");
      return connection.context;
    } else {
      const token = req.headers.authorization || "";
      return { token };
    }
  },
});

// Create GraphQL server
const app = express();
server.applyMiddleware({ app });

// Create GraphQL Subscription server
const httpServer = http.createServer(app);
server.installSubscriptionHandlers(httpServer);

const port = process.env.PORT || 5000;

// Connect to MongoDB
const URI = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.nyod4.azure.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`;
mongoose.connect(URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    httpServer.listen(port, () => {
      console.log(`Server ready at: http://localhost:${port}${server.graphqlPath}`)
      console.log(`Subscriptions ready at ws://localhost:${port}${server.subscriptionsPath}`)
    }
    );
  })
  .catch(err => {
    console.log(err);
  })