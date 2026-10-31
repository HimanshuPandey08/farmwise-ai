import dns from "node:dns";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

if (!process.env.MONGODB_URI) {
  dotenv.config({ path: ".env.local" });
  dotenv.config();
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  throw new Error("Missing MONGODB_URI in environment configuration.");
}

// In cloud/serverless environments (Vercel, AWS Lambda), outbound port 53 UDP to external DNS is blocked.
// Never call dns.setServers in cloud environments. Only attempt public DNS in non-cloud environments
// when using mongodb+srv:// protocol.
const isCloudEnvironment = Boolean(
  process.env.VERCEL ||
  process.env.AWS_REGION ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.NETLIFY ||
  process.env.HEROKU ||
  process.env.NODE_ENV === "production"
);

if (!isCloudEnvironment && uri.startsWith("mongodb+srv://")) {
  try {
    dns.setServers(["8.8.8.8", "8.8.4.4"]);
  } catch {
    // Ignore if setServers is not permitted
  }
}

const globalWithMongo = globalThis;

// Serverless connection pool tuning for Atlas M0 / production
const MONGO_OPTIONS = {
  maxPoolSize: 10,
  minPoolSize: 0,
  maxIdleTimeMS: 60000,
  serverSelectionTimeoutMS: 10000,
  connectTimeoutMS: 10000,
  socketTimeoutMS: 45000,
};

function isClientConnected(clientInstance) {
  if (!clientInstance) return false;
  if (clientInstance.s?.hasBeenClosed) return false;
  if (!clientInstance.topology) return false;
  if (typeof clientInstance.topology.isClosed === "function" && clientInstance.topology.isClosed()) return false;
  if (clientInstance.topology.s?.state === "closed") return false;
  return true;
}

function getActiveClient() {
  if (!globalWithMongo._mongoClient || !isClientConnected(globalWithMongo._mongoClient)) {
    globalWithMongo._mongoClient = new MongoClient(uri, MONGO_OPTIONS);
    globalWithMongo._mongoClientPromise = null;
  }
  return globalWithMongo._mongoClient;
}

function getActiveClientPromise() {
  const activeClient = getActiveClient();
  if (!globalWithMongo._mongoClientPromise) {
    globalWithMongo._mongoClientPromise = activeClient.connect().catch((err) => {
      // Clear promise on failure so subsequent requests can retry cleanly
      globalWithMongo._mongoClientPromise = null;
      throw err;
    });
  }
  return globalWithMongo._mongoClientPromise;
}

// Resilient proxies that guarantee auto-reconnection and avoid MongoTopologyClosedError
const client = new Proxy({}, {
  get(target, prop, receiver) {
    const active = getActiveClient();
    const val = Reflect.get(active, prop, active);
    if (typeof val === "function") {
      return val.bind(active);
    }
    return val;
  },
  has(target, prop) {
    return Reflect.has(getActiveClient(), prop);
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(getActiveClient());
  }
});

const db = new Proxy({}, {
  get(target, prop, receiver) {
    const activeDb = getActiveClient().db("farmwise_ai");
    const val = Reflect.get(activeDb, prop, activeDb);
    if (typeof val === "function") {
      return val.bind(activeDb);
    }
    return val;
  },
  has(target, prop) {
    return Reflect.has(getActiveClient().db("farmwise_ai"), prop);
  },
  getPrototypeOf() {
    return Object.getPrototypeOf(getActiveClient().db("farmwise_ai"));
  }
});

const connectedClientPromise = {
  then(onFulfilled, onRejected) {
    return getActiveClientPromise().then(onFulfilled, onRejected);
  },
  catch(onRejected) {
    return getActiveClientPromise().catch(onRejected);
  },
  finally(onFinally) {
    return getActiveClientPromise().finally(onFinally);
  }
};

export { client, db, connectedClientPromise };
