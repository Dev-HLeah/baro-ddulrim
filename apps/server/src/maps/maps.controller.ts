import { Controller, Get, Query } from "@nestjs/common";
import { MapsService } from "./maps.service";

@Controller("maps")
export class MapsController {
  constructor(private readonly mapsService: MapsService) {}

  @Get("reports")
  async findReportMarkers() {
    return this.mapsService.findReportMarkers();
  }

  @Get("search")
  async searchLocations(@Query("query") query?: string) {
    return this.mapsService.searchLocations(query);
  }
}
