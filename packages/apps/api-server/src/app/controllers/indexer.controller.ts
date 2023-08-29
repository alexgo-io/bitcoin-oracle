import { Controller, Post } from '@nestjs/common';

@Controller('/api/v1')
export class IndexController {
  @Post('/txs')
  async txs() {}
}
