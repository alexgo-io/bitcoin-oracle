import { PinoLoggerModule } from '@brc20-oracle/commons';
import { Enums, ValidatorName } from '@brc20-oracle/types';
import { ValidatorBisModule } from '@brc20-oracle/validator-bis';
import { ValidatorHiroModule } from '@brc20-oracle/validator-hiro';
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
