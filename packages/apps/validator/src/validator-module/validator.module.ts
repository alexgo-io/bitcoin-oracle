import { PinoLoggerModule } from '@alex-b20/commons';
import { Enums, IndexerType } from '@alex-b20/types';
import { ValidatorBisModule } from '@alex-b20/validator-bis';
import { ValidatorHiroModule } from '@alex-b20/validator-hiro';
import { DynamicModule, Module } from '@nestjs/common';
import ValidatorServiceProvider from './validator.service';

@Module({})
export class ValidatorModule {
  static withValidator(type: IndexerType): DynamicModule {
    const moduleMapping = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Enums.IndexerType.enum.okx]: null as any,
      [Enums.IndexerType.enum.bis]: ValidatorBisModule,
      [Enums.IndexerType.enum.hiro]: ValidatorHiroModule,
    };

    const validatorModule = moduleMapping[type];
    if (validatorModule === null) {
      throw new Error(`No validator module for ${type}`);
    }

    return {
      module: ValidatorModule,
      imports: [validatorModule, PinoLoggerModule],
      providers: [ValidatorServiceProvider],
      exports: [ValidatorServiceProvider],
    };
  }
}
