import { Controller, Get } from '@nestjs/common';
import { ApiExcludeEndpoint } from '@nestjs/swagger';

@Controller()
export class IndexController {
  @ApiExcludeEndpoint()
  @Get()
  index(): string {
    return 'ALEX-B20 API';
  }

  @ApiExcludeEndpoint()
  @Get('/healthz')
  health(): string {
    return 'OK';
  }
}
