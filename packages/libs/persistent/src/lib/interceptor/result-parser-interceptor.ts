import { stringifyJSON } from '@bitcoin-oracle/commons';
import { Logger } from '@nestjs/common';
import {
  SchemaValidationError,
  type Interceptor,
  type QueryResultRow,
} from 'slonik';

const logger = new Logger('pg:interceptor:result-parser');
export const createResultParserInterceptor = (): Interceptor => {
  return {
    // If you are not going to transform results using Zod, then you should use `afterQueryExecution` instead.
    // Future versions of Zod will provide a more efficient parser when parsing without transformations.
    // You can even combine the two – use `afterQueryExecution` to validate results, and (conditionally)
    // transform results as needed in `transformRow`.
    transformRow: (executionContext, actualQuery, row) => {
      const { resultParser } = executionContext;

      if (!resultParser) {
        return row;
      }

      const validationResult = resultParser.safeParse(row);

      if (validationResult.success === false) {
        logger.error(
          `Validation result: ${stringifyJSON(validationResult, 2)}
          query: ${actualQuery.sql}
          value: ${stringifyJSON(actualQuery.values, 2)}
          ---
          row: ${stringifyJSON(row, 2)}
          `,
        );
        throw new SchemaValidationError(
          actualQuery,
          row,
          validationResult.error.issues,
        );
      }

      return validationResult.data as QueryResultRow;
    },
  };
};
