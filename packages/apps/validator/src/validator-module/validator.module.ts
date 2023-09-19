import { Enums, IndexerType } from '@alex-b20/types';
import { ValidatorBisModule } from '@alex-b20/validator-bis';
import { DynamicModule, Module } from '@nestjs/common';
import ValidatorServiceProvider from './validator.service';

@Module({})
export class ValidatorModule {
  static withValidator(type: IndexerType): DynamicModule {
    const moduleMapping = {
      [Enums.IndexerType.enum.bis]: ValidatorBisModule,
      [Enums.IndexerType.enum.okx]: null as any,
    };

    const validatorModule = moduleMapping[type];

    return {
      module: ValidatorModule,
      imports: [validatorModule],
      providers: [ValidatorServiceProvider],
      exports: [ValidatorServiceProvider],
    };
  }
}
