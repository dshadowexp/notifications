import config from "../config";
import { winstonLogger } from "@tuller/lib";
import { verify } from "jsonwebtoken";

/**
 * Verifies the JWT token.
 * 
 * @param authToken - The authentication token to verify.
 * @returns The decoded token or an empty string if the token is invalid.
 */
export function verifyJWT(authToken: string | undefined) {
    if (!authToken) {
      return '';
    }
  
    return verify(authToken, config.GATEWAY_JWT_SECRET, { algorithms: ['HS256'] });
}

export const logger = () => {
  //return console;
  try {
    const winLogger = winstonLogger(config.ELASTIC_SEARCH_URL, config.APP_ID, 'info');
    return winLogger;
  } catch (error) {
    return console;
  }
};
