import { PinoLoggerModule } from '@meta-protocols-oracle/commons';
import { Enums, ValidatorName } from '@meta-protocols-oracle/types';
import { ValidatorBisModule } from '@meta-protocols-oracle/validator-bis';
import { ValidatorHiroModule } from '@meta-protocols-oracle/validator-hiro';
import { ValidatorUnisatModule } from '@meta-protocols-oracle/validator-unisat';
import { DynamicModule, Module } from '@nestjs/common';
import ValidatorServiceProvider from './validator.service';

@Module({})
export class ValidatorModule {
  static withValidator(type: ValidatorName): DynamicModule {
    const moduleMapping = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Enums.ValidatorName.enum.okx]: null as any,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      [Enums.ValidatorName.enum.unknown]: null as any,
      [Enums.ValidatorName.enum.bis]: ValidatorBisModule,
      [Enums.ValidatorName.enum.hiro]: ValidatorHiroModule,
      [Enums.ValidatorName.enum.unisat]: ValidatorUnisatModule,
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
