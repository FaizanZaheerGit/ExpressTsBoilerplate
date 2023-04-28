import mongoose from "mongoose";
import config from "../config/config";
import logger from "../logger/logger";


// CONNECT TO MONGO DB
mongoose.connect(config["MONGO_DB_URI"] || "");

// CHECK CONNECTION
mongoose.connection
.on('open', () => { console.log('DB CONNECTION SUCCESSFUL') 
                    logger.info('DB CONNECTION SUCCESSFUL')})
.on('close', () => { console.log('DB CONNECTION CLOSED') 
                      logger.info('DB CONNECTION CLOSED') })
.on('error', (error) => { console.log('ERROR IN CONNECTING DB:\n' + error) 
                          logger.error('ERROR IN CONNECTING DB:\n' + error) });

export default mongoose;
