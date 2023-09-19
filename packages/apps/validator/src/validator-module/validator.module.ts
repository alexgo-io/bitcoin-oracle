import { Enums, IndexerType } from '@alex-b20/types';
import { ValidatorBisModule } from '@alex-b20/validator-bis';
import { DynamicModule, Module } from '@nestjs/common';
import ValidatorServiceProvider from './validator.service';
import { PinoLoggerModule } from "@alex-b20/commons";

@Module({})
export class ValidatorModule {
  static withValidator(type: IndexerType): DynamicModule {
    const moduleMapping = {
      [Enums.IndexerType.enum.bis]: ValidatorBisModule,
      [Enums.IndexerType.enum.okx]: null as any,
    };

    const validatorModule = moduleMapping[type];
    if (validatorModule === null) {
      throw new Error(`No validator module for ${type}`);
    }

    console.log(`Using ${type} validator module: ${validatorModule}`);

    return {
      module: ValidatorModule,
      imports: [validatorModule, PinoLoggerModule],
      providers: [ValidatorServiceProvider],
      exports: [ValidatorServiceProvider],
    };
  }
}
