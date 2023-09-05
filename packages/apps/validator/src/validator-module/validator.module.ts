import { Module } from "@nestjs/common";
import ValidatorServiceProvider from "./validator.service";
import { PinoLoggerModule } from "@alex-b20/commons";

@Module({
  imports: [PinoLoggerModule],
  providers: [ValidatorServiceProvider],
  exports: [ValidatorServiceProvider]
})
export class ValidatorModule {
}
