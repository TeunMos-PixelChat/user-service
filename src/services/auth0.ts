import { User } from 'auth0';
import axios from 'axios';

export default class Auth0Service {
  clientID: string;
  clientSecret: string;
  audience: string;
  domain: string;

  constructor(clientID: string, clientSecret: string, domain: string) {
    this.clientID = clientID;
    this.clientSecret = clientSecret;
    this.audience = `https://${process.env.AUTH0_DOMAIN}/api/v2/`;
    this.domain = domain;
  }

  async getAccessToken() {
    const url = `https://${this.domain}/oauth/token`;
    const data = {
      client_id: this.clientID,
      client_secret: this.clientSecret,
      audience: this.audience,
      grant_type: 'client_credentials',
    };

    const response = await axios.post(url, data);
    return response.data.access_token;
  }

  async getUsers(accessToken: string, query: string | null = null): Promise<User[]> {
    if (query) {
      const url = `https://${this.domain}/api/v2/users`;
      const response = await axios.get<User[]>(url, {
        params: {
          q: query,
          search_engine: 'v3',
        },
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      return response.data;
    }

    const url = `https://${this.domain}/api/v2/users`;
    const response = await axios.get<User[]>(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return response.data;
  }



}