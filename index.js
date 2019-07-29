const { ApolloServer, PubSub } = require("apollo-server");
const gql = require("graphql-tag");
const mongoose = require("mongoose");
require("dotenv").config();

const typeDefs = require("./graphql/typeDefs");
const resolvers = require("./graphql/resolvers");

const pubsub = new PubSub();

const server = new ApolloServer({
  typeDefs: typeDefs,
  resolvers: resolvers,
  context: ({ req }) => ({ req, pubsub })
});

mongoose
  .connect(process.env.MONGO_DB, { useNewUrlParser: true })
  .then(() => {
    console.log("Mongodb Connected");
    return server.listen({ port: 5000 });
  })
  .then(res => {
    console.log(`Server running at ${res.url}`);
  });
