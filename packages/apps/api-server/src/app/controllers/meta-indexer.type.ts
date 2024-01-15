import { ApiProperty } from '@nestjs/swagger';

export class MetaIndexerQueryIndexingDTO {
  @ApiProperty({
    type: 'string',
    enum: ['indexing'],
    required: false,
  })
  type?: string;

  @ApiProperty({
    type: [String],
    required: false,
  })
  tick?: string[];

  @ApiProperty({
    type: [String],
    required: false,
  })
  from?: string[];

  @ApiProperty({
    type: [String],
    required: false,
  })
  to?: string[];

  @ApiProperty({
    type: [String],
    required: false,
  })
  from_or_to?: string[];

  @ApiProperty({
    type: [Number],
    required: false,
  })
  height?: number[];

  @ApiProperty({
    type: 'number',
    required: false,
    maximum: 10000,
    minimum: 1,
  })
  limit?: number;
}

export class MetaIndexerQueryToDTO {
  @ApiProperty({
    type: 'string',
    enum: ['to'],
    required: true,
  })
  type!: string;

  @ApiProperty({
    type: 'string',
    required: true,
  })
  to!: string;

  @ApiProperty({
    type: 'string',
    required: false,
  })
  after_updated_at?: string;

  @ApiProperty({
    type: 'number',
    required: false,
    maximum: 10000,
    minimum: 1,
  })
  limit?: number;
}
