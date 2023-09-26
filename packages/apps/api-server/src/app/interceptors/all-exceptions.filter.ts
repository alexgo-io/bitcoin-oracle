import {
  parseErrorDetail,
  stringifyJSON,
  toErrorDetailsHttpException,
} from '@bitcoin-oracle/commons';
import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { env } from '../../env';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('AllExceptionsFilter');
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const statusDetails = toErrorDetailsHttpException(exception);
    const { debugInfos, apiError } = statusDetails;
    let data = apiError;

    if (env.ENABLE_DEBUG_INFO) {
      data = {
        error: {
          ...apiError.error,
          details: [...apiError.error.details, ...debugInfos],
        },
      };
      this.logger.error(
        `Error occurred for request ${request.url}, ${stringifyJSON(
          data,
          2,
        )}
            `,
      );
    }

    try {
      response.status(statusDetails.getStatus()).json(data);
    } catch (e) {
      this.logger.error(
        `
        }Fail to set error response for request ${
          request.url
        }, ${parseErrorDetail(e)}`,
      );
    }
  }
}
