import { PinoLoggerModule } from '@bitcoin-oracle/commons';
import { Enums, ValidatorName } from '@bitcoin-oracle/types';
import { ValidatorBisModule } from '@bitcoin-oracle/validator-bis';
import { ValidatorHiroModule } from '@bitcoin-oracle/validator-hiro';
import { DynamicModule, Module } from '@nestjs/common';
import ValidatorServiceProvider from './validator.service';

@Module({})
export class ValidatorModule {
  static withValidator(type: ValidatorName): DynamicModule {
    const moduleMapping = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Enums.ValidatorName.enum.okx]: null as any,
      [Enums.ValidatorName.enum.bis]: ValidatorBisModule,
      [Enums.ValidatorName.enum.hiro]: ValidatorHiroModule,
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
