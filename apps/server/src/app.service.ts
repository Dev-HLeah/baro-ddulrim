import { Injectable } from "@nestjs/common";

@Injectable()
export class AppService {
  getHealth() {
    return {
      service: "baro-ddulrim-server",
      status: "ok",
      timestamp: new Date().toISOString()
    };
  }
}
