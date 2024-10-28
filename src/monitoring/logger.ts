import config from "../config";
import { winstonLogger } from "@tuller/lib";

export const logger = () => {
  //return console;
  try {
    const winLogger = winstonLogger(config.ELASTIC_SEARCH_URL, config.APP_ID, 'info');
    return winLogger;
  } catch (error) {
    return console;
  }
};
